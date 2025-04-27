import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { showToast } from '@/lib/toast';
import api from '@/lib/api';

type RevalidateOption = 'all' | 'users' | 'complaints' | 'stats';

export function CacheRevalidation() {
  const [isRevalidating, setIsRevalidating] = useState<Record<RevalidateOption, boolean>>({
    all: false,
    users: false,
    complaints: false,
    stats: false
  });
  
  const handleRevalidate = async (option: RevalidateOption) => {
    setIsRevalidating(prev => ({ ...prev, [option]: true }));
    
    try {
      let type: string;
      let tags: string[] = [];
      
      switch (option) {
        case 'all':
          type = 'all';
          break;
        case 'users':
          type = 'user';
          break;
        case 'complaints':
          type = 'complaint';
          break;
        case 'stats':
          type = 'specific';
          tags = ['basic-stats', 'time-trends', 'category-relationships', 'word-frequency', 'cluster', 'topics'];
          break;
        default:
          type = 'all';
      }
      
      await api.post('/api/v1/revalidate', { type, tags });
      showToast('success', 'Cache Refreshed', `${option} data has been refreshed successfully.`);
    } catch (error) {
      console.error(`Error revalidating ${option} cache:`, error);
      showToast('error', 'Revalidation Failed', `Failed to refresh ${option} data.`);
    } finally {
      setIsRevalidating(prev => ({ ...prev, [option]: false }));
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Cache Management</CardTitle>
        <CardDescription>
          Refresh cached data to see the most recent information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <RevalidateCard
            title="All Data"
            description="Refresh all cached data"
            isRevalidating={isRevalidating.all}
            onRevalidate={() => handleRevalidate('all')}
          />
          <RevalidateCard
            title="Users"
            description="Refresh user data"
            isRevalidating={isRevalidating.users}
            onRevalidate={() => handleRevalidate('users')}
          />
          <RevalidateCard
            title="Complaints"
            description="Refresh complaints data"
            isRevalidating={isRevalidating.complaints}
            onRevalidate={() => handleRevalidate('complaints')}
          />
          <RevalidateCard
            title="Statistics"
            description="Refresh analytics data"
            isRevalidating={isRevalidating.stats}
            onRevalidate={() => handleRevalidate('stats')}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Last server-side cache revalidate time: {new Date().toLocaleTimeString()}
        </p>
      </CardFooter>
    </Card>
  );
}

interface RevalidateCardProps {
  title: string;
  description: string;
  isRevalidating: boolean;
  onRevalidate: () => void;
}

function RevalidateCard({ title, description, isRevalidating, onRevalidate }: RevalidateCardProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          onClick={onRevalidate}
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={isRevalidating}
        >
          {isRevalidating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
