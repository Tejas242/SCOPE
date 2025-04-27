import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getAuthorizationHeader } from '@/lib/api-utils';
import { getCacheOptions, revalidateAfterMutation } from '@/lib/cache-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    const complaintId = params.id;
    
    const response = await fetch(`${getBaseUrl()}/api/v1/complaints/${complaintId}`, {
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
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch complaint details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    const complaintData = await request.json();
    const complaintId = params.id;
    
    const response = await fetch(`${getBaseUrl()}/api/v1/complaints/${complaintId}`, {
      method: 'PUT',
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
    
    // Revalidate complaint-related caches after update
    revalidateAfterMutation('complaint');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { detail: 'Failed to update complaint' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    const complaintId = params.id;
    
    const response = await fetch(`${getBaseUrl()}/api/v1/complaints/${complaintId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    // Revalidate complaint-related caches after deletion
    revalidateAfterMutation('complaint');
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json(
      { detail: 'Failed to delete complaint' },
      { status: 500 }
    );
  }
}
