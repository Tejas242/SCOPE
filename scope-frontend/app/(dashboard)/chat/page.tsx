'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Send, Loader2, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, ChatMessage as ChatMessageType, ApiError } from '@/types';

export default function ChatPage() {

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
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
        content: 'Hello! I\'m the SCOPE Assistant. I can help you with analyzing complaints, providing statistics, and updating statuses. How can I assist you today?',
        timestamp: new Date()
      }
    ]);
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
    setError('');

    try {
      const response = await api.post<{ response: string }>('/api/v1/chatbot/chat', { 
        message: userMessage 
      });
      
      // Add assistant response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error chatting with assistant:', error);
      const apiError = error as ApiError;
      setError(
        apiError.data?.detail || 
        apiError.message || 
        'Failed to communicate with the assistant'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Chat Assistant</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            SCOPE Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div 
                      className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="p-4">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
