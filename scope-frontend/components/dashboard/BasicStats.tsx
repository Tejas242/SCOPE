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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.total_complaints || 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            All-time submissions
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {openComplaints}
          </div>
          {stats && (
            <div className="text-xs text-muted-foreground mt-1">
              {((openComplaints / stats.total_complaints) * 100).toFixed(1)}% of total complaints
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Critical Urgency</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {criticalUrgency}
          </div>
          {stats && (
            <div className="text-xs text-muted-foreground mt-1">
              {((criticalUrgency / stats.total_complaints) * 100).toFixed(1)}% of total complaints
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {stats ? `${stats.response_rate.toFixed(1)}%` : 'N/A'}
          </div>
          {stats && (
            <div className="text-xs text-muted-foreground mt-1">
              {stats.assigned_rate.toFixed(1)}% of complaints assigned
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
