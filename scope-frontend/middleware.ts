import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login';
  
  // Get token from cookies or local storage
  // Note: middleware can only access cookies, not localStorage
  // We'll need to manage token synchronization between cookies and localStorage
  const token = request.cookies.get('token')?.value || '';
  
  // If already logged in and trying to access login page, redirect to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If not logged in and trying to access a protected route, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
