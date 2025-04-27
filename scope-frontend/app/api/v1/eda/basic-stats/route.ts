import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getAuthorizationHeader } from '@/lib/api-utils';
import { getCacheOptions } from '@/lib/cache-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    const response = await fetch(`${getBaseUrl()}/api/v1/eda/basic-stats`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      ...getCacheOptions('basic-stats')
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching basic stats:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch basic stats' },
      { status: 500 }
    );
  }
}
