import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login';
  
  // Define API routes that should be excluded from middleware checks
  const isApiRoute = path.startsWith('/api/');
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value || '';
  
  // Skip middleware check for API routes (they handle auth separately)
  if (isApiRoute) {
    return;
  }
  
  // If already logged in and trying to access login page, redirect to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If not logged in and trying to access a protected route, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Exclude Next.js assets from middleware processing
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
