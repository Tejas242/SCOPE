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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Data updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Basic Stats Cards Section */}
      <BasicStatsDisplay stats={basicStats} loading={loading} />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="categories" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Time Trends</TabsTrigger>
          <TabsTrigger value="words">Word Analysis</TabsTrigger>
          <TabsTrigger value="clusters">Complaint Clusters</TabsTrigger>
          <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
        </TabsList>
        
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
      
      <div className="mt-8 text-sm text-muted-foreground border-t pt-4">
        <p>
          This dashboard provides AI-powered analytics on SCOPE complaint data. The visualizations 
          help identify patterns, trends, and insights to improve response and resolution strategies.
        </p>
      </div>
    </div>
  );
}
