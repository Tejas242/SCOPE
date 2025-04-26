from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.dependencies.auth import get_current_user, get_current_staff_user
from app.chatbot.agent import get_chatbot_agent


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_scope(
    message: ChatMessage,
    current_user = Depends(get_current_staff_user)
) -> Any:
    """
    Chat with the SCOPE Assistant.
    
    This endpoint allows staff users to interact with the SCOPE chatbot assistant,
    which can help with analyzing complaints, providing statistics, and updating statuses.
    """
    try:
        chatbot = get_chatbot_agent()
        response = await chatbot.process_message(message.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )
