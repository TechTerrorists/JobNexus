from langchain_community.document_loaders import PDFPlumberLoader
import os
from pinecone import Pinecone
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langgraph.graph import StateGraph, START, END
from scraper.linkedInScraper import LinkedInScraper
from state.resumeState import JobMatchingAgentState, ProfileSchema


embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",output_dimensionality=768)
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    timeout=30
    # ... (other params)
)
vector_store=PineconeVectorStore(index_name=os.environ["PINECONE_INDEX_NAME"],embedding=embeddings,)
def loadResume(state:JobMatchingAgentState):
    """
    extract Raw Text
    """
    loader = PDFPlumberLoader(state["file_path"])
    docs=loader.load()
    return {
            "raw_text":docs[0].page_content,
            "status":"TEXT_EXTRACTED"
        }

def extract_profile(state:JobMatchingAgentState):
    """
    Extract Candidate Profile Based On Resume Uploaded
    """
    structuredmodel=model.with_structured_output(ProfileSchema)
    result=structuredmodel.invoke(state["raw_text"])
    return {
        "extracted_data":result,
        "status":"STRUCTURED"
    }

def generate_embedding_and_store(state:JobMatchingAgentState):
    profile = state["extracted_data"]
    semantic_text = f"""
    Role: {profile.role}
    Skills: {", ".join(profile.skills)}
    Experience: {profile.experience_years} years
    Education: {', '.join([f"{e.degree} at {e.institution}" for e in profile.education])}
    Projects: {" ".join(profile.projects)}
    Achievements: {" ".join(profile.achievements)}
    """
    metadata = {
        "user_id": state["user_id"],
        "role":profile.role
    }

    embedding = vector_store.add_texts(
        texts=[semantic_text],
        metadatas=[metadata],
        ids=[state["user_id"]])
    return {
        "status": "EMBEDDING_GENERATED"
    }

async def extract_jobs(state:JobMatchingAgentState):
    async with LinkedInScraper(headless=True) as client:
        jobs = await client.search_jobs(state["prefered_role"],state["prefered_location"])
    return{ "ScrapedJobs":jobs}
        

workflow = StateGraph(JobMatchingAgentState)


workflow.add_node("Resume_Loader", loadResume)
workflow.add_node("Profile_Extractor", extract_profile)
workflow.add_node("Embbeder_and_VectorStorage", generate_embedding_and_store)
workflow.add_node("Extract_Jobs", extract_jobs)


workflow.add_edge(START, "Resume_Loader")
workflow.add_edge("Resume_Loader", "Profile_Extractor")
workflow.add_edge("Profile_Extractor", "Embbeder_and_VectorStorage")
workflow.add_edge("Embbeder_and_VectorStorage","Extract_Jobs")
workflow.add_edge("Extract_Jobs", END)

resume_subgraph = workflow.compile()

resume_tool = resume_subgraph.as_tool(
    name="resume_processor",
    description="Loads the Resume and Extract Raw Text from the Resume , Make a Structured Output from the raw text, Create embeddings and store in Vector Db , Find the jobs based on Resume",
    arg_types={"file_path": str,"user_id":str,"prefered_role":str,"prefered_location":str} # Or use input_schema=ResumeProcessInput
)