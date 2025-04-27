from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.dependencies.auth import get_current_staff_user
from app.chatbot.agent import get_chatbot_agent


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    has_tool_calls: bool


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
    Session ID can be provided to continue a conversation, otherwise a new session is created.
    """
    try:
        chatbot = get_chatbot_agent()
        result = await chatbot.process_message(message=message.message, session_id=message.session_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )
