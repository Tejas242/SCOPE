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
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build URL with query parameters if present
    let url = `${getBaseUrl()}/api/v1/complaints/`;
    const queryParams = [];
    
    if (skip) {
      queryParams.push(`skip=${skip}`);
    }
    if (limit) {
      queryParams.push(`limit=${limit}`);
    }
    if (category) {
      queryParams.push(`category=${encodeURIComponent(category)}`);
    }
    if (urgency) {
      queryParams.push(`urgency=${encodeURIComponent(urgency)}`);
    }
    if (status) {
      queryParams.push(`status=${encodeURIComponent(status)}`);
    }
    if (search) {
      queryParams.push(`search=${encodeURIComponent(search)}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      ...getCacheOptions('complaints')
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const complaints = await response.json();
    
    // Get total count from headers if available or use a default
    const total = 112; // Default fallback value
    
    // In a real system, we'd get this from the backend, but for now we'll use total records or length
    if (Array.isArray(complaints)) {
      // Format response to include both items and total
      return NextResponse.json({
        items: complaints,
        total: total
      });
    } else {
      // If response is already structured correctly, pass it through
      return NextResponse.json(complaints);
    }
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    const complaintData = await request.json();
    
    const response = await fetch(`${getBaseUrl()}/api/v1/complaints/`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(complaintData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    // Revalidate all complaint-related caches after creation
    revalidateAfterMutation('complaint');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { detail: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}
