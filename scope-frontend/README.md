This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
