from typing import Any, Dict, Literal, Optional, TypedDict,List

from pydantic import BaseModel, Field

class Education(BaseModel):
    institution: str
    degree: str

class ProfileSchema(BaseModel):
    skills: List[str] = Field(description="List of technical and soft skills")
    experience_years: float = Field(description="Total years of professional experience")
    education: List[Education] = Field(description="Degrees and institutions")
    projects: List[str] = Field(description="Key projects and their descriptions")
    achievements: List[str] = Field(description="professional achievements")
    location: Optional[str] 
    role:str


class JobMatchingAgentState(TypedDict):
    user_id:int
    raw_text: str
    extracted_data: ProfileSchema
    prefered_location:str
    prefered_role:str
    ScrapedJobs:Dict
    
    status:Literal[
        "STARTING",
        "TEXT_EXTRACTED",
        "STRUCTURED",
        "EMBEDDING_GENERATED",
        "COMPLETED",
        "FAILED"
    ]

