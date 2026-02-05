from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.apis.main import router as ChatRouter
import uvicorn

app = FastAPI(
    title="JobNexus",
    description="API for matching resumes with LinkedIn job listings",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ChatRouter)
@app.get("/")
async def root():
    return {"message" : "server operational"}

if __name__ == "__main__":
    uvicorn.run(app, host = "0.0.0.0", port = 8000) 
