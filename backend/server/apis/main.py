from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, TypedDict, cast
import asyncio
import os
import tempfile
from pathlib import Path
import sys
from mainAgent import mainagent
from langgraph.types import Command
from langchain.messages import HumanMessage

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatInitiateRequest(BaseModel):
    user_id: str
    thread_id: str
    message: str

@router.post("/initiate")
async def ChatInitiate(request: ChatInitiateRequest):
    thread_config = {"configurable": {"thread_id": request.thread_id}}   
    initialState={"user_id":request.user_id,"messages":[HumanMessage(content=request.message)]}
    try:
        state =await mainagent.ainvoke(initialState,config=thread_config) # type: ignore
    except Exception as e:
        return {"error":str(e)}
    return {
        "AIMessage": state["messages"][-1].content, # type: ignore
        "state": state,
        "thread_id": request.thread_id
    }

@router.get("/continue")
async def continue_chat(thread_id: str, response: str):
    thread_config = {"configurable": {"thread_id": thread_id}}
    try:
        state = await mainagent.ainvoke(
            {"messages": [HumanMessage(content=response)]},
            config=thread_config
        )
    except Exception as e:
        return {"error": str(e)}
    
    return {
        "AIMessage": state["messages"][-1].content,
        "state": state,
        "thread_id": thread_id
    }

@router.get("/health")
async def health_check():
    """Health check endpoint for the Chat Router"""
    return {"status": "healthy", "service": "Chat"}