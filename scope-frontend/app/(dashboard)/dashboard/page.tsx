'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BasicStats, TimeTrend, CategoryRelationships, WordFrequency, ApiError } from '@/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [timeTrends, setTimeTrends] = useState<{ monthly_counts: TimeTrend[] } | null>(null);
  const [categoryRelationships, setCategoryRelationships] = useState<CategoryRelationships | null>(null);
  const [wordFrequency, setWordFrequency] = useState<WordFrequency[]>([]);

  // Define some nice colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [basicStatsRes, timeTrendsRes, categoryRelationshipsRes, wordFrequencyRes] = await Promise.all([
          api.get<BasicStats>('/api/v1/eda/basic-stats'),
          api.get<{ monthly_counts: TimeTrend[] }>('/api/v1/eda/time-trends'),
          api.get<CategoryRelationships>('/api/v1/eda/category-relationships'),
          api.get<WordFrequency[]>('/api/v1/eda/word-frequency')
        ]);
        
        setBasicStats(basicStatsRes.data);
        setTimeTrends(timeTrendsRes.data);
        setCategoryRelationships(categoryRelationshipsRes.data);
        setWordFrequency(wordFrequencyRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const apiError = error as ApiError;
        setError(apiError.data?.detail || apiError.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {loading ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {basicStats?.total_complaints || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {basicStats?.open_complaints || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Urgency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {basicStats?.critical_urgency || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {basicStats?.avg_response_time ? `${basicStats.avg_response_time.toFixed(1)} hrs` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Complaint Categories</TabsTrigger>
          <TabsTrigger value="trends">Time Trends</TabsTrigger>
          <TabsTrigger value="words">Common Words</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <Card className="pt-6">
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : categoryRelationships ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={Object.entries(categoryRelationships.category_counts || {}).map(([key, value]) => ({
                      name: key,
                      count: value,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-[300px]">
                  <p className="text-muted-foreground">No category data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card className="pt-6">
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : timeTrends ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={timeTrends.monthly_counts || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-[300px]">
                  <p className="text-muted-foreground">No time trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="words">
          <Card className="pt-6">
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : wordFrequency && wordFrequency.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={wordFrequency.slice(0, 15)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="word" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={wordFrequency.slice(0, 10)}
                        dataKey="count"
                        nameKey="word"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        label={({ word }: WordFrequency) => word}
                      >
                        {wordFrequency.slice(0, 10).map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px]">
                  <p className="text-muted-foreground">No word frequency data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
