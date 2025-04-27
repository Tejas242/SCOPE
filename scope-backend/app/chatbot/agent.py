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
            model="gemini-2.0-flash-lite",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.7
        )
        
        # Create system prompt
        self.system_prompt = """You are SCOPE Assistant, an AI helper for the Student Complaint Optimisation and Prioritization Engine.
        Your job is to help university staff analyze and respond to student complaints effectively.
        
        CAPABILITIES:
        - Search for complaints using keywords or semantic search
        - View detailed complaint information, including status and responses
        - Update complaint statuses (Pending, In Progress, Resolved, Closed)
        - Assign complaints to staff members
        - Add responses to complaints
        - Get statistics by complaint category
        - Predict categories for new complaint text
        - Identify trending topics in recent complaints
        - Manage a priority queue of urgent complaints
        - Perform batch updates on multiple complaints
        - Generate visualizations and plots for data analysis:
          * Status distribution charts
          * Category distribution charts
          * Urgency distribution charts
          * Time trend analysis
          * Category comparisons
          * Resolution time analysis
        
        COMMUNICATION STYLE:
        - Be professional, helpful and concise in your responses
        - When responding to queries about complaints, focus on providing actionable insights
        - Use a supportive tone that acknowledges staff workload
        - Actively suggest next steps when helping with complaints
        - When explaining visualizations, highlight key insights and patterns
        
        RESPONSE FORMATTING:
        - Use markdown tables for displaying complaint data and statistics
        - Highlight urgent matters that need immediate staff attention
        - Use bullet points for listing multiple items or steps
        - Use emoji indicators for status (⏱️ Pending, ⚙️ In Progress, ✅ Resolved, 🔒 Closed)
        - Use emoji indicators for urgency (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low)
        
        DATA VISUALIZATION:
        When asked for charts, plots, or visual analytics, suggest using the appropriate visualization tool. 
        For example:
        - "Can you show me the status distribution?" → Use the status distribution plot tool
        - "How are complaints distributed by category?" → Use the category distribution plot tool
        - "Show me urgency levels by category" → Use the urgency distribution plot tool with by_category=true
        - "How have complaints changed over time?" → Use the time trend plot tool
        - "Compare IT Support and Academic complaints" → Use the category comparison plot tool
        - "How long does it take to resolve complaints?" → Use the resolution time plot tool
        
        Always focus on helping staff efficiently manage, prioritize and resolve student complaints.
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
            
            # Ensure the message is not empty to prevent API errors
            if not message.strip():
                return {
                    "response": "I received an empty message. Please provide some text for me to respond to.",
                    "session_id": session_id,
                    "has_tool_calls": False
                }
                
            # Process the message with explicit message history passing
            result = await agent_executor.ainvoke(
                {
                    "input": message,
                    "chat_history": chat_history
                }
            )
            
            # Update chat history with this exchange
            human_msg = HumanMessage(content=message)
            
            # Check if the response is empty and provide a fallback
            if not result["output"] or not result["output"].strip():
                response_text = "I don't have a specific response for that query. How else can I help you?"
                ai_msg = AIMessage(content=response_text)
            else:
                ai_msg = AIMessage(content=result["output"])
                # Clean up the response to remove any leading/trailing code block markers
                response_text = result["output"]
                
            self.sessions[session_id]["history"].extend([human_msg, ai_msg])
            
            # Only process response_text if it exists
            if response_text:
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
            error_message = str(e)
            print(f"Chatbot error: {error_message}")
            
            # Provide specific responses for known error types
            if "empty text parameter" in error_message.lower():
                # Add a fallback message to the history to prevent future errors
                fallback_msg = "I'll need to think about that some more. How can I help you with something else?"
                if session_id in self.sessions:
                    ai_msg = AIMessage(content=fallback_msg)
                    self.sessions[session_id]["history"].append(ai_msg)
                return {
                    "response": fallback_msg,
                    "session_id": session_id or str(uuid.uuid4()),
                    "has_tool_calls": False
                }
            
            elif "database" in error_message.lower() or "sql" in error_message.lower():
                # Database connectivity issues
                error_response = "I'm having trouble connecting to the complaint database. Please check your database connection and try again."
            
            elif "model" in error_message.lower() or "prediction" in error_message.lower():
                # ML model issues
                error_response = "I encountered an issue with the prediction model. Analytical features may be limited, but you can still search and manage complaints."
            
            elif "memory" in error_message.lower() or "timeout" in error_message.lower():
                # Performance issues
                error_response = "Your request is taking longer than expected to process. Please try a simpler query or try again later."
            
            elif "permission" in error_message.lower() or "access" in error_message.lower():
                # Access issues
                error_response = "You may not have permission to perform this action. Please check your access rights or contact an administrator."
            
            else:
                # Generic error
                error_response = "I encountered an error while processing your request. Please try again with different wording or contact technical support."
            
            # Log detailed error for debugging
            print(f"Detailed error in chatbot: {error_message}")
            
            return {
                "response": error_response,
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
