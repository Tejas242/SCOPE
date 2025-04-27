import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationHeader } from '@/lib/api-utils';
import { revalidateAfterMutation, revalidateCacheTags, CacheTags } from '@/lib/cache-utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the body to determine which caches to revalidate
    const body = await request.json();
    const { type = 'all', tags = [] } = body;
    
    if (type === 'all') {
      // Revalidate all caches
      revalidateAfterMutation('all');
    } else if (type === 'user') {
      revalidateAfterMutation('user');
    } else if (type === 'complaint') {
      revalidateAfterMutation('complaint');
    } else if (type === 'specific' && Array.isArray(tags) && tags.length > 0) {
      // Revalidate specific tags
      revalidateCacheTags(tags as CacheTags[]);
    } else {
      return NextResponse.json(
        { detail: 'Invalid revalidation type or tags' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Cache revalidation of type '${type}' completed successfully.`
    });
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return NextResponse.json(
      { detail: 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}
