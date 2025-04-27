import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryRelationships } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Info } from 'lucide-react';
import { useState } from 'react';

interface CategoryChartProps {
  data: CategoryRelationships | null;
  loading: boolean;
}

// Colors for different categories
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', 
  '#d0ed57', '#83a6ed', '#8dd1e1', '#a4506c', '#9e67ab'
];

export default function CategoryChart({ data, loading }: CategoryChartProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  if (loading) {
    return (
      <Card className="pt-6">
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.category_urgency.categories.length) {
    return (
      <Card className="pt-6">
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">No category data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform the crosstab data for the BarChart
  const categoryUrgencyData = data.category_urgency.categories.map((category, categoryIndex) => {
    const dataPoint: { [key: string]: any } = { name: category };
    
    data.category_urgency.urgency_levels?.forEach((urgency, urgencyIndex) => {
      dataPoint[urgency] = data.category_urgency.data[categoryIndex][urgencyIndex];
    });
    
    return dataPoint;
  });

  const categoryStatusData = data.category_status.categories.map((category, categoryIndex) => {
    const dataPoint: { [key: string]: any } = { name: category };
    
    data.category_status.statuses?.forEach((status, statusIndex) => {
      dataPoint[status] = data.category_status.data[categoryIndex][statusIndex];
    });
    
    return dataPoint;
  });

  // Simple category count data for basic view
  const categoryCountData = data.category_urgency.categories.map((category, index) => {
    const total = data.category_urgency.data[index].reduce((sum, val) => sum + val, 0);
    return { name: category, count: total };
  });

  // Calculate totals for each category to sort
  const sortedCategoryData = [...categoryCountData].sort((a, b) => b.count - a.count);

  const handleCategoryMouseOver = (index: number) => {
    setActiveCategory(index);
  };

  const handleCategoryMouseLeave = () => {
    setActiveCategory(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Complaint Categories</CardTitle>
            <CardDescription>Distribution of complaints across categories</CardDescription>
          </div>
          <div className="rounded-full bg-muted p-2">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 w-full max-w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="by-urgency">By Urgency</TabsTrigger>
            <TabsTrigger value="by-status">By Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedCategoryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} complaints`, 'Count']}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="count" fill="#8884d8">
                  {sortedCategoryData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      opacity={activeCategory === null || activeCategory === index ? 1 : 0.3}
                      onMouseOver={() => handleCategoryMouseOver(index)}
                      onMouseLeave={handleCategoryMouseLeave}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="by-urgency" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryUrgencyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                barGap={0}
                barCategoryGap="15%"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.category_urgency.urgency_levels?.map((urgency, index) => (
                  <Bar 
                    key={urgency} 
                    dataKey={urgency} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]}
                    name={urgency}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="by-status" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryStatusData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                barGap={0}
                barCategoryGap="15%"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.category_status.statuses?.map((status, index) => (
                  <Bar 
                    key={status} 
                    dataKey={status} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]} 
                    name={status}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
