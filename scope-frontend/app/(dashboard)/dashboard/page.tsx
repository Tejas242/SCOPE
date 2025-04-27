'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BasicStats, TimeTrends, CategoryRelationships, WordFrequency, ClusterData, TopicsData, ApiError } from '@/types';

import BasicStatsDisplay from '@/components/dashboard/BasicStats';
import CategoryChart from '@/components/dashboard/CategoryChart';
import TimeSeriesChart from '@/components/dashboard/TimeSeriesChart';
import WordFrequencyChart from '@/components/dashboard/WordFrequencyChart';
import ClusterVisualization from '@/components/dashboard/ClusterVisualization';
import TopicsExplorer from '@/components/dashboard/TopicsExplorer';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [timeTrends, setTimeTrends] = useState<TimeTrends | null>(null);
  const [categoryRelationships, setCategoryRelationships] = useState<CategoryRelationships | null>(null);
  const [wordFrequency, setWordFrequency] = useState<WordFrequency[]>([]);
  const [clusterData, setClusterData] = useState<ClusterData | null>(null);
  const [topicsData, setTopicsData] = useState<TopicsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel with proper typing
        const [
          basicStatsRes, 
          timeTrendsRes, 
          categoryRelationshipsRes, 
          wordFrequencyRes,
          clusterDataRes,
          topicsDataRes
        ] = await Promise.all([
          api.get<BasicStats>('/api/v1/eda/basic-stats'),
          api.get<TimeTrends>('/api/v1/eda/time-trends'),
          api.get<CategoryRelationships>('/api/v1/eda/category-relationships'),
          api.get<WordFrequency[]>('/api/v1/eda/word-frequency'),
          api.get<ClusterData>('/api/v1/eda/cluster'),
          api.get<TopicsData>('/api/v1/eda/topics')
        ]);
        
        setBasicStats(basicStatsRes.data);
        setTimeTrends(timeTrendsRes.data);
        setCategoryRelationships(categoryRelationshipsRes.data);
        setWordFrequency(wordFrequencyRes.data);
        setClusterData(clusterDataRes.data);
        setTopicsData(topicsDataRes.data);
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
    <div className="-mt-3 -mx-4 md:-mx-8 h-[calc(100vh-3rem)]">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header section with glow effect */}
        <div className="relative">
          <div className="absolute -top-12 -left-8 h-16 w-80 bg-primary/10 dark:bg-primary/20 blur-2xl rounded-full -z-10"></div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Insights from student complaint data</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 dark:bg-muted/10 rounded-lg border dark:border-border/30 shadow-sm dark:shadow-md">
              <div className="h-2 w-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-sm">
                Data updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Stats Cards Section */}
        <BasicStatsDisplay stats={basicStats} loading={loading} />

        {/* Main Dashboard Tabs - Full-width without surrounding card */}
        <div>
          <Tabs defaultValue="categories" className="mt-2">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-xl font-semibold">Detailed Analysis</h2>
              <TabsList className="p-1 bg-muted/50 dark:bg-muted/30">
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="trends">Time Trends</TabsTrigger>
                <TabsTrigger value="words">Word Analysis</TabsTrigger>
                <TabsTrigger value="clusters">Clusters</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="categories">
              <CategoryChart data={categoryRelationships} loading={loading} />
            </TabsContent>
          
            <TabsContent value="trends">
              <TimeSeriesChart data={timeTrends} loading={loading} />
            </TabsContent>
          
            <TabsContent value="words">
              <WordFrequencyChart data={wordFrequency} loading={loading} />
            </TabsContent>
          
            <TabsContent value="clusters">
              <ClusterVisualization data={clusterData} loading={loading} />
            </TabsContent>
          
            <TabsContent value="topics">
              <TopicsExplorer data={topicsData} loading={loading} />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="text-sm text-muted-foreground border-t dark:border-t-border/30 pt-4 bg-muted/10 dark:bg-muted/5 p-4 rounded-lg">
          <p>
            This dashboard provides AI-powered analytics on SCOPE complaint data. The visualizations 
            help identify patterns, trends, and insights to improve response and resolution strategies.
          </p>
        </div>
      </div>
    </div>
  );
}
