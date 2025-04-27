import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidateAfterMutation } from '@/lib/cache-utils';

export async function POST() {
  try {
    // Clear the token cookie
    (await cookies()).delete('token');
    
    // Revalidate all caches to ensure user doesn't see stale data on next login
    revalidateAfterMutation('all');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { detail: 'Logout failed' },
      { status: 500 }
    );
  }
}
