# SCOPE Frontend

This is the frontend component of the SCOPE (Student Complaint Optimisation and Prioritization Engine) project, built with Next.js and TypeScript.

## Overview

The SCOPE frontend provides a modern, responsive user interface for the complaint management system. It features role-based dashboards, interactive data visualizations, and a seamless user experience for administrators, staff, and students.

## Tech Stack

- **Next.js**: React framework for building web applications
- **TypeScript**: Type-safe programming language
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI components
- **Recharts**: Composable charting library for data visualization

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes and Caching

This project uses Next.js API Routes to proxy requests to the FastAPI backend. 

For detailed information about:
- API Route implementation: See [API-ROUTE-DOCS.md](./API-ROUTE-DOCS.md)
- Caching implementation: See [CACHING-DOCS.md](./CACHING-DOCS.md)

### API Proxying Benefits
- Secure backend URL and credentials management
- HTTP-only cookie based authentication
- Clean separation of concerns
- Query parameter handling
- Consistent error handling

### Caching System
The caching system provides performance optimization through:
- Time-based cache revalidation with configurable durations
- Tag-based cache invalidation for precise control
- Manual cache control for administrators
- Different cache durations optimized by data type

### Complete API Coverage
All API endpoints defined in the OpenAPI specification are implemented, including:
- Authentication endpoints
- User management
- Complaint handling and classification
- Data analysis endpoints 
- Chatbot integration