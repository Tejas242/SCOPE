import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    
    // Set the token in cookies - will be available for both client and server components
    cookies().set({
      name: 'token',
      value: data.access_token,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Authentication failed' },
      { status: 500 }
    );
  }
}
