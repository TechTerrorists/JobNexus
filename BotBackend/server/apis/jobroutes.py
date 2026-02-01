from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, cast
import asyncio
import os
import tempfile
from pathlib import Path
import sys

current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent.parent  # Goes from apis -> server -> backend
sys.path.insert(0, str(backend_dir))


from resumeagent import resume_subgraph
from state.resumeState import JobMatchingAgentState, ProfileSchema

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobSearchRequest(BaseModel):
    user_id: str
    prefered_role: str
    prefered_location: str
    file_path: Optional[str] = None


class JobSearchResponse(BaseModel):
    status: str
    message: str
    scraped_jobs: Any  # Can be list or dict depending on your scraper output
    user_id: str
    job_count: int


@router.post("/match-jobs", response_model=JobSearchResponse)
async def match_jobs_from_resume(
    user_id: str = Form(...),
    prefered_role: str = Form(...),
    prefered_location: str = Form(...),
    resume_file: UploadFile = File(...)
):
    if not resume_file.filename or not resume_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    temp_file_path = None
    try:
        # Create a temporary file to store the uploaded resume
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        content = await resume_file.read()
        temp_file.write(content)
        temp_file.close()
        temp_file_path = temp_file.name
        
        input_state = {
            "user_id": user_id,
            "file_path": temp_file_path,
            "prefered_role": prefered_role,
            "prefered_location": prefered_location,
            "raw_text": "",             
            "extracted_data": None,      
            "ScrapedJobs": {},           
            "status": "STARTING"
        }
        
        # Run the resume processing workflow
        result = await resume_subgraph.ainvoke(input_state)
        
        # Extract the scraped jobs from the result
        scraped_jobs = result.get("ScrapedJobs", [])
        
        # Calculate job count - handle both dict and list
        if isinstance(scraped_jobs, dict):
            job_count = len(scraped_jobs.get("jobs", []))
        elif isinstance(scraped_jobs, list):
            job_count = len(scraped_jobs)
        else:
            job_count = 0
        
        return JobSearchResponse(
            status="success",
            message=f"Successfully processed resume and found {job_count} jobs",
            scraped_jobs=scraped_jobs,
            user_id=user_id,
            job_count=job_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing resume: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@router.post("/match-jobs-existing", response_model=JobSearchResponse)
async def match_jobs_from_existing_resume(request: JobSearchRequest):
    """
    Process an existing resume file (already on server) and get matching jobs.
    
    Parameters:
    - user_id: Unique identifier for the user
    - prefered_role: Desired job role
    - prefered_location: Preferred job location
    - file_path: Path to the resume file on the server
    
    Returns:
    - Scraped jobs matching the resume profile
    """
    
    if not request.file_path:
        raise HTTPException(status_code=400, detail="file_path is required")
    
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    try:
        # Prepare input state for the agent - only required fields
        input_state = {
            "user_id": request.user_id,
            "file_path": request.file_path,
            "prefered_role": request.prefered_role,
            "prefered_location": request.prefered_location
        }
        
        # Run the resume processing workflow
        result = await resume_subgraph.ainvoke(input_state)
        
        # Extract the scraped jobs from the result
        scraped_jobs = result.get("ScrapedJobs", [])
        
        # Calculate job count - handle both dict and list
        if isinstance(scraped_jobs, dict):
            job_count = len(scraped_jobs.get("jobs", []))
        elif isinstance(scraped_jobs, list):
            job_count = len(scraped_jobs)
        else:
            job_count = 0
        
        return JobSearchResponse(
            status="success",
            message=f"Successfully processed resume and found {job_count} jobs",
            scraped_jobs=scraped_jobs,
            user_id=request.user_id,
            job_count=job_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing resume: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the jobs router"""
    return {"status": "healthy", "service": "job-matching"}
