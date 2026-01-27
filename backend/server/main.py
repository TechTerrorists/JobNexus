from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apis.jobroutes import router as JobRouter
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

app.include_router(JobRouter)

@app.get("/")
async def root():
    return {"message" : "server operational"}

if __name__ == "__main__":
    uvicorn.run(app, host = "0.0.0.0", port = 8000) 
