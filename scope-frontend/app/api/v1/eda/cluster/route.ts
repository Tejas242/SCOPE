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
    const n_clusters = searchParams.get('n_clusters');
    
    // Build URL with query parameters if present
    let url = `${getBaseUrl()}/api/v1/eda/cluster`;
    if (n_clusters) {
      url += `?n_clusters=${n_clusters}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      ...getCacheOptions('cluster')
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cluster data:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch cluster data' },
      { status: 500 }
    );
  }
}
