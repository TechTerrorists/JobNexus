from datetime import datetime
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    email: EmailStr
    password: str
    createdat: datetime
    updatedat: datetime
    
