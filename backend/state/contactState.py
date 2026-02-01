from typing import Any, Dict, Literal, Optional, TypedDict,List

from pydantic import BaseModel, Field

class Contacts(BaseModel):
    profile_link:str= Field(description="LinkedIn Profile URL")
    profile_id:str= Field(description="Profile Id Of LinkedIn User")
    name:str= Field(description="Name Of LinkedIn User ")
    current_position:str= Field(description="current position of LinkedIn User")
    current_company:str= Field(description="current company of LinkedIn User")
    bio:str= Field(description="Bio of LinkedIn User")
    email:Optional[str]= Field(description="Email of LinkedIn User")
    skills:List[str]=Field(description="List of technical and soft skills")

class ReferralState(TypedDict):
    user_id:int
    company_name: str
    search_term: Optional[str] = ""
    location: Optional[str] = ""
    rawContacts:List[Any]
    contacts:List[Contacts]
    status:Literal[
        "STARTING",
        "FIND_CONTACTS",
        "STRUCTUREDCONTACTS",
        "STOREDB",
        "COMPLETED",
        "FAILED"
    ]