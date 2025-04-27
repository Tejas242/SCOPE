# Next.js API Route Caching Implementation

This document explains how caching is implemented for the Next.js API routes in the SCOPE application.

## Overview

The caching implementation uses Next.js 15's built-in caching features to improve performance and reduce load on the FastAPI backend. We've implemented:

1. **Route Handler Caching**: Using fetch with `cache` and `next.revalidate` options
2. **Tag-based Cache Invalidation**: For precise control over cache revalidation
3. **Manual Cache Control**: Admin UI for manually revalidating caches

## Cache Configuration

Different data types have different cache durations:

| Data Type | Cache Duration | Reason |
|-----------|---------------|--------|
| Users | 60 seconds | User data changes infrequently |
| Complaints | 60 seconds | New complaints might be added regularly |
| Basic Stats | 5 minutes | Stats don't change rapidly |
| Time Trends | 15 minutes | Time-based analysis is relatively static |
| Category Relationships | 15 minutes | Relationship data changes slowly |
| Word Frequency | 30 minutes | Word frequency analysis is computation-intensive |
| Cluster | 60 minutes | Clustering results change infrequently |
| Topics | 60 minutes | Topic modeling results change infrequently |

## Caching Strategy

### GET Endpoints
- All GET endpoints use appropriate cache durations
- Each endpoint is tagged with relevant cache tags

### POST/PUT/DELETE Endpoints
- No caching for mutation operations
- Automatic revalidation of related caches after mutations
- Special handling for analytical endpoints like `/api/v1/complaints/classify` and `/api/v1/complaints/predict` which are POST but don't modify data

### Cache Revalidation
Three main strategies for cache revalidation:

1. **Time-based Revalidation**: Caches automatically revalidate after their specified duration
2. **Action-based Revalidation**: Caches are revalidated after relevant mutations (create, update, delete)
3. **Manual Revalidation**: Admin users can manually revalidate caches through the UI

## Implementation Details

### Cache Utility Functions
Located in `/lib/cache-utils.ts`:

- `getCacheOptions`: Returns fetch options with appropriate cache settings
- `revalidateCacheTags`: Revalidates specific cache tags
- `revalidateAfterMutation`: Revalidates related caches after mutations

### Cache Tags
We use tags to categorize and target specific caches for revalidation:

- `users`: All user-related data
- `complaints`: Complaint data
- `basic-stats`, `time-trends`, etc.: Specific data analysis results

## Admin Controls

Administrators can manually revalidate caches through the Settings page:

1. Navigate to Settings
2. Select the "System" tab
3. Use the Cache Management section to revalidate specific cache types

## Performance Considerations

- Cache durations are balanced between freshness and performance
- Computation-intensive operations have longer cache durations
- Frequently changed data has shorter cache durations

## Deployment Considerations

In production environments:
- Consider using a distributed cache for multi-instance deployments
- Adjust cache durations based on actual usage patterns
- Monitor memory usage as cached data accumulates
