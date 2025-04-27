import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getAuthorizationHeader } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    const chatData = await request.json();
    
    const response = await fetch(`${getBaseUrl()}/api/v1/chatbot/chat`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatData),
      // No caching for chat responses
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chatbot request:', error);
    return NextResponse.json(
      { detail: 'Chatbot request failed' },
      { status: 500 }
    );
  }
}
