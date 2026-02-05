import asyncio
from langgraph.graph import StateGraph, START
from langchain_google_genai import ChatGoogleGenerativeAI 
from langgraph.checkpoint.memory import MemorySaver
import os
from typing import Annotated, Optional, TypedDict
from db.database import supabase
from dotenv import load_dotenv
from resumeagent import resume_tool
from reviewerAgent import referrals_tool
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain.messages import HumanMessage, AIMessage, SystemMessage # type: ignore
from langgraph.prebuilt import InjectedState
load_dotenv()

class AgentState(TypedDict):
    user_id: str
    messages:Annotated[list[BaseMessage], add_messages]

async def my_referral_tool(company_name: str, search_term:str,location: str,state: Annotated[AgentState, InjectedState]):
    """
    Find the Referrals for the User
    """

    subgraph_initial_state = {
        "user_id":state["user_id"],
        "company_name":company_name,
        "search_term":search_term,
        "location":location,
        "status":"STARTING",
    }

    result = await referrals_tool.ainvoke(subgraph_initial_state)

    return{
        "Referrals":result["contacts"]
    }



async def my_resume_tool(prefered_role: str, prefered_location: str,state: Annotated[AgentState, InjectedState]):
    """
    Find the relevant jobs for the user
    """
    subgraph_initial_state = {
        "user_id":state["user_id"],
        "prefered_location":prefered_location,
        "prefered_role":prefered_role,
        "status":"STARTING",
    }
    result = await resume_tool.ainvoke(subgraph_initial_state)

    return {
        "scraped_jobs": result["ScrapedJobs"]
    }
      
tools = [my_resume_tool,my_referral_tool]
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    timeout=30
)
llm_with_tools=model.bind_tools(tools)
async def call_model(state: AgentState):
    print(state["user_id"])
    prompt=[SystemMessage(content=f"You are a job-matching assistant. "
        "If the user asks for jobs and provides role and location, "
        "you MUST call the appropriate tool. "
        "IMPORTANT: After listing jobs, you MUST end your response with this exact line: '***All found jobs are stored in the Jobs section.***'")]+state["messages"]
    print("LLM is started")
    response = await llm_with_tools.ainvoke(prompt)
    print("Response of llm",response)
    
    # Append the message if jobs were found
    try:
        if response.content:
            if isinstance(response.content, list):
                content_str = ' '.join([str(item) for item in response.content])
            else:
                content_str = str(response.content)
            
            if any(keyword in content_str.lower() for keyword in ['job', 'opening', 'position']):
                if '***All found jobs are stored in the Jobs section.***' not in content_str:
                    if isinstance(response.content, str):
                        response.content = content_str + '\n\n***All found jobs are stored in the Jobs section.***'
    except Exception as e:
        print(f"Error appending message: {e}")
    
    return {"messages": [response]}

workflow = StateGraph(AgentState)

workflow.add_node("agent", call_model)
workflow.add_node("tools", ToolNode(tools))

workflow.add_edge(START, "agent")

workflow.add_conditional_edges(
    "agent",
    tools_condition,
)

workflow.add_edge("tools", "agent")

memory = MemorySaver()
mainagent = workflow.compile(checkpointer=memory)

async def run_example():
    config = {"configurable": {"thread_id": "user_session_1"}}
    input_data = {
        "user_id": "c0d8efbc-57be-4f5a-b9bf-cbb7ecab4ab5",
        "messages": [HumanMessage(content=" can u help me find jobs my preferred location is Bangalore, India and preferred role is Software Engineer")]
    }
    final_state = await mainagent.ainvoke(input_data, config=config) # type: ignore
    if "messages" in final_state:
        for msg in final_state["messages"]:
            print(msg.content)

if __name__ == "__main__":
    asyncio.run(run_example())
