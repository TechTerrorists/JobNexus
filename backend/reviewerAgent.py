import asyncio
import os
import uuid
from pinecone import Pinecone
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langgraph.graph import StateGraph, START, END
from scraper.profile_scraper import LinkedInScraperConfig, LinkedInScraperService, StaffSearchParams
from state.contactState import Contacts, ReferralState
from langchain_core.prompts import PromptTemplate
from db.database import supabase

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",output_dimensionality=768)

model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    timeout=30
    # ... (other params)
)



async def findContacts(state:ReferralState):
    """
    Scrape linkedin profiles based on company For Referrals
    """
    config = LinkedInScraperConfig(session_file="scraper/session.pkl", log_level=1)
    service = LinkedInScraperService()
    service.initialize(config=config)
    scraper = service.get_scraper()
    params = StaffSearchParams( 
            company_name=state["company_name"],
            search_term=state["search_term"],
            location=state["location"],
            extra_profile_data=True,
            max_results=1)
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(
            None,
            scraper.scrape_staff_to_dict,
            params
    )
    return {
        "rawContacts":results,
        "status":"FIND_CONTACTS"
    }

async def getstructuredContacts(state:ReferralState):
    """
    Get Structured Output of the Contacts 
    """
    structuredmodel=model.with_structured_output(Contacts)
    template=PromptTemplate(template="""
    Extract all the details from the linkedin profile data 
    Data:{rawtext}""", 
    input_variables='rawtext')

    prompt=template.invoke({'rawtext':state["rawContacts"]})
    result=structuredmodel.invoke(prompt)
    if isinstance(result, list):
        contacts_list = [Contacts(**r) if isinstance(r, dict) else r for r in result]
    else:
        contacts_list = [Contacts(**result)] if isinstance(result, dict) else [result]
    return {
        "contacts":contacts_list,
        "status":"STRUCTURED"
    }

async def store(state:ReferralState):
    """
    Store Contacts information in db 
    store Contacts in Contact context layer
    """
    try:
        links=supabase.table("contact").select("profile_link").eq("user_id",state["user_id"]).execute()
        profile_links = {
        row["profile_link"]
        for row in (links.data or [])
        }
        
        for contact in state["contacts"]:
            if(not (contact.profile_link in profile_links)):
                supabase.table("contact").insert({"id":str(uuid.uuid4()),"user_id":state["user_id"],**contact.model_dump()}).execute()
    except Exception as e:
        print("error",e)
        raise RuntimeError("error")
    
workflow = StateGraph(ReferralState)

workflow.add_node("Find_Contacts",findContacts)
workflow.add_node("Structured_Contacts",getstructuredContacts)
workflow.add_node("Store",store)


workflow.add_edge(START,"Find_Contacts")
workflow.add_edge("Find_Contacts","Structured_Contacts")
workflow.add_edge("Structured_Contacts","Store")
workflow.add_edge("Store",END)

findreferrals_tool_subgraph=workflow.compile()

referrals_tool = findreferrals_tool_subgraph.as_tool(
    name="Referrals_Finder",
    description="Scrapes Linkedin profile based on Company and find Referrals, Get Structured Output from the Linkedin Profiles, Store it in Database",
    arg_types={"user_id":str,"company_name":str,"search_term":str,"location":str}
)