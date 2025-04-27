import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getBaseUrl() {
  return API_URL;
}

export function getAuthorizationHeader(request?: NextRequest): string | null {
  // For API routes, get from cookie store
  if (!request) {
    const cookieStore = cookies();
    const token = cookieStore.get('token');
    return token ? `Bearer ${token.value}` : null;
  }
  
  // For middleware or client components with request
  const token = request.cookies.get('token')?.value;
  return token ? `Bearer ${token}` : null;
}

export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, data: error, message: response.statusText };
  }
  
  // Check if the response has content
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  
  return null;
}
