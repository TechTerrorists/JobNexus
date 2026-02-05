from pydantic import BaseModel
from typing import Optional

class JobData(BaseModel):
    title: str
    company: str
    location: str
    job_link: str
    posted_date: str

class JobSearchRequest(BaseModel):
    user_id: str
    prefered_role: str
    prefered_location: str
    file_path: Optional[str] = None

class JobSearchResponse(BaseModel):
    status: str
    message: str
    scraped_jobs: list
    user_id: str
