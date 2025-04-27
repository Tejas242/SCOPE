'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Bot, Copy, Settings, SendIcon } from 'lucide-react';
import { User, ChatMessage as ChatMessageType, ApiError } from '@/types';
import { showToast } from '@/lib/toast';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user info from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User);
    }

    // Add welcome message
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m the SCOPE Assistant. How can I help you today? I can analyze complaints, provide statistics, or update statuses.',
        timestamp: new Date()
      }
    ]);

    // Focus the input field when component mounts
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setLoading(true);
    
    // Add a temporary loading message
    const loadingMessageId = Date.now();
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
      isLoading: true,
      id: loadingMessageId
    }]);

    try {
      const response = await api.post<{ response: string, session_id: string, has_tool_calls: boolean }>('/api/v1/chatbot/chat', { 
        message: userMessage,
        session_id: sessionId 
      });
      
      // Store session id for conversation continuity
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }
      
      // Ensure we have a valid response
      if (!response.data || !response.data.response) {
        throw new Error("Received empty response from server");
      }

      // Remove loading message and add the real response
      setMessages(prev => prev
        // Filter out the loading message
        .filter(msg => !(msg.isLoading && msg.id === loadingMessageId))
        // Add the real response
        .concat([{
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          hasToolCalls: response.data.has_tool_calls || false,
          sessionId: response.data.session_id,
          id: Date.now()
        }])
      );
    } catch (error) {
      console.error('Error chatting with assistant:', error);
      const apiError = error as ApiError;
      
      // Remove the loading message
      setMessages(prev => prev.filter(msg => !(msg.isLoading && msg.id === loadingMessageId)));
      
      // Show error toast instead of inline error
      const errorMsg = apiError.data?.detail || apiError.message || 'Failed to communicate with the assistant';
      showToast('error', 'Chat Error', errorMsg);
    } finally {
      setLoading(false);
      // Focus the input field after submitting
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] w-full -mt-3 -mx-4 md:-mx-8">
      {/* Main Chat Container */}
      <div className="flex flex-col flex-1 w-full overflow-hidden bg-background/60 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/10 shadow-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 h-8 w-8 flex items-center justify-center rounded-full">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">SCOPE AI Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-muted-foreground">Online • Ready to help</p>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-muted/5">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex gap-2.5 max-w-[85%] md:max-w-2xl ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <Avatar className="mt-0.5 h-8 w-8 border border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs">AI</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="mt-0.5 h-8 w-8 border border-muted/20">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : msg.isLoading
                        ? 'bg-muted/20 border border-muted/30 animate-pulse'
                        : 'bg-muted/10 border border-muted/20 shadow-sm' 
                  }`}
                >
                  {msg.isLoading ? (
                    <div className="flex items-center gap-1.5 py-0.5 px-1">
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    <>
                      <div className={msg.role === 'assistant' 
                        ? "prose-sm dark:prose-invert max-w-none prose-p:leading-normal prose-headings:font-semibold prose-a:text-blue-600 prose-p:my-0 prose-headings:my-2"
                        : "text-sm"
                      }>
                        {msg.role === 'assistant' ? (
                          <div dangerouslySetInnerHTML={{ 
                            __html: marked.parse(msg.content || "No content available", {
                              gfm: true,
                              breaks: true,
                            })
                          }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                      
                      {/* Message footer */}
                      <div 
                        className={`flex items-center justify-between mt-1 text-[10px] ${
                          msg.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}
                      >
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        
                        {msg.role === 'assistant' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 px-1.5 text-[10px] hover:bg-background/80 rounded-full"
                            title="Copy to clipboard"
                            onClick={() => {
                              const textToCopy = msg.content.replace(/\n\n/g, '\n');
                              navigator.clipboard.writeText(textToCopy);
                              showToast('success', 'Copied!', 'Message content copied to clipboard');
                            }}
                          >
                            <Copy className="h-2.5 w-2.5 mr-1" />
                            Copy
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input - More clean and modern */}
        <div className="px-4 py-3 backdrop-blur-sm bg-background/80 border-t">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex items-end gap-2 relative">
            <div className="relative w-full">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="resize-none py-3 pr-12 min-h-[48px] max-h-32 focus-visible:ring-primary/40 text-sm bg-muted/10 border rounded-2xl"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || !input.trim()} 
              className={`rounded-full h-10 w-10 ${loading || !input.trim() ? 'bg-muted' : 'bg-primary'} absolute right-2 bottom-1.5`}
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
