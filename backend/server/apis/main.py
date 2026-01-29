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

@router.post("/initiate")
async def ChatInitiate(user_id:int,thread_id:str,message:str):
    thread_config = {"configurable": {"thread_id": thread_id}}    
    initialState={"user_id":user_id,"messages":[HumanMessage(content=message)]}
    try:
        state =await mainagent.ainvoke(initialState,config=thread_config) # type: ignore
    except Exception as e:
        return {"error":e}
    return {
        "AIMessage": state["messages"][-1].content, # type: ignore
        "state": state,
        "thread_id": thread_id
    }

@router.get("/continue")
def continue_chat(thread_id: str, response: str):
    thread_config = {"configurable": {"thread_id": thread_id}}
    state = await mainagent.ainvoke( # type: ignore
        Command(resume = response), 
        config=thread_config) # type: ignore

    return {
        "AIMessage": state["messages"][-1].content,
        "state": state,
        "thread_id": thread_id
    }

@router.get("/health")
async def health_check():
    """Health check endpoint for the Chat Router"""
    return {"status": "healthy", "service": "Chat"}