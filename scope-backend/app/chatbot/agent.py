from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage
from typing import List, Dict, Any

from app.core.config import settings
from app.chatbot.tools import get_chatbot_tools


class ChatbotAgent:
    def __init__(self):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("Google API key not set. Please set the GOOGLE_API_KEY environment variable.")
        
        # Initialize the Gemini model
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-001",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.7,
            convert_system_message_to_human=True
        )
        
        # Create system prompt
        system_prompt = """You are SCOPE Assistant, an AI helper for the Student Complaint Optimisation and Prioritization Engine.
        Your job is to help university staff analyze and respond to student complaints effectively.
        You can search for complaints, get complaint details, update complaint statuses, and provide statistics.
        Be professional, helpful and concise in your responses. 
        When responding to queries about complaints, focus on providing actionable insights and clear information.
        """
        
        # Get tools for the agent
        tools = get_chatbot_tools()
        
        # Create the prompt template with system message and include agent_scratchpad
        # This is required for the agent to work correctly
        prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessage(content=system_prompt),
                ("human", "{input}"),
                ("ai", "{agent_scratchpad}")
            ]
        )
        
        # Create the agent
        self.agent = create_openai_functions_agent(
            llm=self.llm,
            tools=tools,
            prompt=prompt
        )
        
        # Create the agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
        )
    
    async def process_message(self, message: str) -> str:
        try:
            result = await self.agent_executor.ainvoke(
                {"input": message, "agent_scratchpad": ""}
            )
            return result["output"]
        except Exception as e:
            print(f"Chatbot error: {str(e)}")
            return f"I encountered an error while processing your request. Please try again or contact support."


# Singleton instance
chatbot_agent = None


def get_chatbot_agent():
    """Get or create chatbot agent singleton with error handling"""
    global chatbot_agent
    if chatbot_agent is None:
        try:
            chatbot_agent = ChatbotAgent()
            print("Chatbot agent initialized successfully")
        except Exception as e:
            print(f"Failed to initialize chatbot agent: {str(e)}")
            # Create a simple fallback agent
            class FallbackAgent:
                async def process_message(self, message: str) -> str:
                    return "I'm sorry, the chatbot service is currently unavailable. Please try again later."
            chatbot_agent = FallbackAgent()
    return chatbot_agent
