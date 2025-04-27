import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getAuthorizationHeader } from '@/lib/api-utils';
import { getCacheOptions } from '@/lib/cache-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const n_topics = searchParams.get('n_topics');
    const n_words = searchParams.get('n_words');
    
    // Build URL with query parameters if present
    let url = `${getBaseUrl()}/api/v1/eda/topics`;
    const queryParams = [];
    
    if (n_topics) {
      queryParams.push(`n_topics=${n_topics}`);
    }
    if (n_words) {
      queryParams.push(`n_words=${n_words}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      ...getCacheOptions('topics')
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching topics data:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch topics data' },
      { status: 500 }
    );
  }
}
