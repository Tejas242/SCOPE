import { revalidateTag } from 'next/cache';

export type CacheTags = 
  | 'users' 
  | 'complaints' 
  | 'basic-stats' 
  | 'time-trends' 
  | 'category-relationships'
  | 'word-frequency'
  | 'cluster'
  | 'topics';

// Cache configuration for different data types
export const CACHE_CONFIG = {
  // User-related data changes relatively frequently
  users: {
    revalidate: 60, // 1 minute
    tags: ['users']
  },
  // Complaints change when users add or modify them
  complaints: {
    revalidate: 60, // 1 minute
    tags: ['complaints']
  },
  // Stats are less frequently updated
  'basic-stats': {
    revalidate: 300, // 5 minutes
    tags: ['basic-stats']
  },
  'time-trends': {
    revalidate: 900, // 15 minutes
    tags: ['time-trends']
  },
  'category-relationships': {
    revalidate: 900, // 15 minutes
    tags: ['category-relationships']
  },
  'word-frequency': {
    revalidate: 1800, // 30 minutes
    tags: ['word-frequency']
  },
  'cluster': {
    revalidate: 3600, // 1 hour
    tags: ['cluster']
  },
  'topics': {
    revalidate: 3600, // 1 hour
    tags: ['topics']
  }
};

/**
 * Utility function to revalidate multiple cache tags
 */
export function revalidateCacheTags(tags: CacheTags[]): void {
  tags.forEach(tag => revalidateTag(tag));
}

/**
 * Get fetch options with cache configuration
 */
export function getCacheOptions(cacheType: keyof typeof CACHE_CONFIG) {
  const config = CACHE_CONFIG[cacheType];
  return {
    next: {
      revalidate: config.revalidate,
      tags: config.tags
    }
  };
}

/**
 * Revalidate caches based on data mutation type
 */
export function revalidateAfterMutation(mutationType: 'user' | 'complaint' | 'all'): void {
  switch (mutationType) {
    case 'user':
      revalidateCacheTags(['users']);
      break;
    case 'complaint':
      revalidateCacheTags([
        'complaints', 
        'basic-stats', 
        'time-trends', 
        'category-relationships',
        'word-frequency',
        'cluster',
        'topics'
      ]);
      break;
    case 'all':
      // Revalidate all caches
      Object.keys(CACHE_CONFIG).forEach(key => 
        revalidateCacheTags([key as CacheTags])
      );
      break;
  }
}
