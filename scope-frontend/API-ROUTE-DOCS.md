# Next.js API Routes Implementation

This document explains how the API routes have been implemented to proxy requests between the frontend and backend.

## Architecture

```
Client (Browser) → Next.js Frontend → Next.js API Routes → FastAPI Backend
```

## Benefits of Using Next.js API Routes

1. **Security**: Backend API URL and authentication details are not exposed to the client
2. **Simplified Authentication**: Token is stored in HTTP-only cookies, reducing XSS risks
3. **Error Handling**: Centralized error handling for API requests
4. **Simpler Client Code**: Frontend code uses relative URLs that work in any environment
5. **Better Type Safety**: TypeScript ensures type consistency between frontend and backend
6. **CORS Avoidance**: No need to configure CORS on the backend for browser requests
7. **Rate Limiting**: Can implement rate limiting at the API route level
8. **Caching**: Can implement caching strategies for improved performance

## Implementation Details

- Created API routes that mirror the FastAPI backend endpoints
- Updated authentication to use cookies instead of localStorage for token storage
- Modified middleware to skip API routes and focus on page routes
- All API requests now go through Next.js API routes instead of directly to the FastAPI backend

## API Routes Implemented

1. **Authentication Routes**
   - /api/v1/auth/login (POST)
   - /api/v1/auth/logout (POST)

2. **User Management Routes**
   - /api/v1/users/ (GET with skip/limit params, POST)
   - /api/v1/users/[id] (GET, PUT, DELETE)

3. **Complaint Management Routes**
   - /api/v1/complaints/ (GET with skip/limit params, POST)
   - /api/v1/complaints/classify (POST)
   - /api/v1/complaints/predict (POST)
   - /api/v1/complaints/[id] (GET, PUT, DELETE)

4. **Chatbot Routes**
   - /api/v1/chatbot/chat (POST)

5. **Exploratory Data Analysis Routes**
   - /api/v1/eda/basic-stats (GET)
   - /api/v1/eda/time-trends (GET)
   - /api/v1/eda/category-relationships (GET)
   - /api/v1/eda/word-frequency (GET with limit param)
   - /api/v1/eda/cluster (GET with n_clusters param)
   - /api/v1/eda/topics (GET with n_topics/n_words params)
   
6. **Cache Management Routes**
   - /api/v1/revalidate (POST)

## Environmental Configuration

- Added `.env.local` file for backend API URL configuration 
- Added `.env` file for production settings
- This allows different environments (development, staging, production) to use different backend URLs

## Deployment Considerations

### Production Setup
When deploying to production:

1. Set the `NEXT_PUBLIC_API_URL` environment variable to your production backend URL
2. Ensure cookie settings are secure:
   - Set `secure: true` for HTTPS environments
   - Configure proper `sameSite` values based on your cross-domain requirements

### Scaling
- API routes run on Edge functions by default in Next.js 15
- For high-load scenarios, consider implementing caching with SWR or React Query
- Use Redis or other caching solutions for frequently accessed data

## File Structure

```
/app/api/v1/
  ├── auth/
  │   ├── login/
  │   │   └── route.ts
  │   └── logout/
  │       └── route.ts
  ├── chatbot/
  │   └── chat/
  │       └── route.ts
  ├── complaints/
  │   ├── [id]/
  │   │   └── route.ts
  │   ├── classify/
  │   │   └── route.ts
  │   ├── predict/
  │   │   └── route.ts
  │   └── route.ts
  ├── eda/
  │   ├── basic-stats/
  │   │   └── route.ts
  │   ├── category-relationships/
  │   │   └── route.ts
  │   ├── cluster/
  │   │   └── route.ts
  │   ├── time-trends/
  │   │   └── route.ts
  │   ├── topics/
  │   │   └── route.ts
  │   └── word-frequency/
  │       └── route.ts
  ├── users/
  │   ├── [id]/
  │   │   └── route.ts
  │   └── route.ts
  ├── revalidate/
  │   └── route.ts
  └── route.ts
```

## API Client

The API client has been updated to use relative URLs and rely on Next.js API routes for handling authentication.

## Security Improvements

1. **Token Storage**:
   - Tokens are now stored in HTTP-only cookies instead of localStorage
   - This prevents client-side JavaScript from accessing tokens, mitigating XSS attacks

2. **Request Proxying**:
   - Backend API URL is never exposed to the client
   - Authentication headers are added server-side
   
3. **Error Handling**:
   - Server errors are sanitized before sending to the client
   - Prevents leaking sensitive information

4. **Authentication Flow**:
   - Cookie-based authentication is handled automatically by the browser
   - More resistant to CSRF with proper SameSite cookie configuration

## Query Parameter Handling

All API routes properly handle query parameters defined in the OpenAPI specification:

1. **Pagination Parameters**
   - `skip` and `limit` for listing users and complaints
   
2. **Analysis Parameters**
   - `limit` for word frequency analysis
   - `n_clusters` for clustering analysis
   - `n_topics` and `n_words` for topic modeling

This enables more efficient data retrieval and better frontend performance.
