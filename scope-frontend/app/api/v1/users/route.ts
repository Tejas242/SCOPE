import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getAuthorizationHeader } from '@/lib/api-utils';
import { getCacheOptions, revalidateAfterMutation } from '@/lib/cache-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const skip = searchParams.get('skip');
    const limit = searchParams.get('limit');
    
    // Build URL with query parameters if present
    let url = `${getBaseUrl()}/api/v1/users/`;
    const queryParams = [];
    
    if (skip) {
      queryParams.push(`skip=${skip}`);
    }
    if (limit) {
      queryParams.push(`limit=${limit}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      ...getCacheOptions('users')
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = await getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    const userData = await request.json();
    
    const response = await fetch(`${getBaseUrl()}/api/v1/users/`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    // Revalidate user-related caches after creation
    revalidateAfterMutation('user');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { detail: 'Failed to create user' },
      { status: 500 }
    );
  }
}
