import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BasicStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface BasicStatsProps {
  stats: BasicStats | null;
  loading: boolean;
}

export default function BasicStatsDisplay({ stats, loading }: BasicStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const openComplaints = stats?.by_status?.["Open"] || 0;
  const criticalUrgency = stats?.by_urgency?.["Critical"] || 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.total_complaints || 0}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {openComplaints}
          </div>
          {stats && (
            <div className="text-xs text-muted-foreground mt-1">
              {((openComplaints / stats.total_complaints) * 100).toFixed(1)}% of total
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Critical Urgency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {criticalUrgency}
          </div>
          {stats && (
            <div className="text-xs text-muted-foreground mt-1">
              {((criticalUrgency / stats.total_complaints) * 100).toFixed(1)}% of total
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats ? `${stats.response_rate.toFixed(1)}%` : 'N/A'}
          </div>
          {stats && (
            <div className="text-xs text-muted-foreground mt-1">
              {stats.assigned_rate.toFixed(1)}% assigned
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
