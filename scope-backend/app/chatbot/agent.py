from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Any, Optional
import uuid

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
            temperature=0.7
        )
        
        # Create system prompt
        self.system_prompt = """You are SCOPE Assistant, an AI helper for the Student Complaint Optimisation and Prioritization Engine.
        Your job is to help university staff analyze and respond to student complaints effectively.
        You can search for complaints, get complaint details, update complaint statuses, and provide statistics.
        Be professional, helpful and concise in your responses. 
        When responding to queries about complaints, focus on providing actionable insights and clear information.
        
        When you use tools, format your responses in a more structured way:
        - When showing complaint data, use markdown tables for better readability
        - For statistics, mention key insights or trends you notice
        - Highlight any urgent matters that need staff attention
        - Use bullet points for listing multiple items
        """
        
        # Get tools for the agent
        self.tools = get_chatbot_tools()
        
        # Track active sessions with their own message history
        self.sessions = {}
    
    def _create_agent_for_session(self, session_id: str):
        """Create a new agent with for a specific session"""
        
        # Create the prompt template with system message and include agent_scratchpad
        prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessage(content=self.system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
                ("ai", "{agent_scratchpad}")
            ]
        )
        
        # Create the agent
        agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        # Create the agent executor
        agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True
        )
        
        return agent_executor
    
    async def process_message(self, message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Process a message in a specific session. Creates a new session if none provided."""
        try:
            # Generate a session ID if one wasn't provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            # Initialize new session if needed
            if session_id not in self.sessions:
                self.sessions[session_id] = {
                    "agent": self._create_agent_for_session(session_id),
                    "history": []
                }
                print(f"Created new chatbot session: {session_id}")
            
            # Access session data
            session_data = self.sessions[session_id]
            agent_executor = session_data["agent"]
            chat_history = session_data["history"]
            
            # Process the message with explicit message history passing
            result = await agent_executor.ainvoke(
                {
                    "input": message,
                    "chat_history": chat_history
                }
            )
            
            # Update chat history with this exchange
            human_msg = HumanMessage(content=message)
            ai_msg = AIMessage(content=result["output"])
            self.sessions[session_id]["history"].extend([human_msg, ai_msg])
            
            # Clean up the response to remove any leading/trailing code block markers
            response_text = result["output"]
            # Remove leading and trailing triple backticks that might be present in tool outputs
            response_text = response_text.strip()
            if response_text.startswith("```"):
                # Find the end of the first code block marker
                first_newline = response_text.find("\n")
                if first_newline != -1:
                    response_text = response_text[first_newline + 1:]
            
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()
            
            # Return response with metadata
            return {
                "response": response_text,
                "session_id": session_id,
                "has_tool_calls": "tool_calls" in result
            }
        except Exception as e:
            print(f"Chatbot error: {str(e)}")
            return {
                "response": f"I encountered an error while processing your request: {str(e)}. Please try again or contact support.",
                "session_id": session_id or str(uuid.uuid4()),
                "has_tool_calls": False
            }


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
