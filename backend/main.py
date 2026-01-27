import asyncio
from langgraph.graph import StateGraph, START
from langchain_google_genai import ChatGoogleGenerativeAI 
from langgraph.checkpoint.memory import MemorySaver
import os
from typing import Annotated, TypedDict
from db.database import supabase
from dotenv import load_dotenv
from resumeagent import resume_tool
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
load_dotenv()

class AgentState(TypedDict):
    user_id: str
    messages:Annotated[list[BaseMessage], add_messages]



tools = [resume_tool]
        
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    timeout=30
)
llm_with_tools=model.bind_tools(tools)
def call_model(state: AgentState):
    response = llm_with_tools.invoke(state["messages"])
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
app = workflow.compile(checkpointer=memory)

app = workflow.compile()

async def run_example():
    config = {"configurable": {"thread_id": "user_session_1"}}
    input_data = {
        "user_id": "user_123",
        "messages": [("user", "user_id is user123 Here is my resume: ./Jake_s_Resume__3_.pdf Preffered role is Software Engineer and preffered location is India. Can you find Jobs for me.")]
    }
    async for event in app.astream(input_data, config=config): # type: ignore
        for node, values in event.items():
            print(f"\n--- Node: {node} ---")
            if "messages" in values:
                print(values["messages"][-1].content)

if __name__ == "__main__":
    asyncio.run(run_example())
