import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeTrends } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Info } from 'lucide-react';

interface TimeSeriesChartProps {
  data: TimeTrends | null;
  loading: boolean;
}

// Colors for different categories
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', 
  '#d0ed57', '#83a6ed', '#8dd1e1', '#a4506c', '#9e67ab'
];

export default function TimeSeriesChart({ data, loading }: TimeSeriesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Trends</CardTitle>
          <CardDescription>Loading time trends data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || (!data.daily_counts.dates.length && !data.monthly_by_category.length)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Trends</CardTitle>
          <CardDescription>No time trend data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">No time series data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format daily counts data for charts
  const dailyData = data.daily_counts.dates.map((date, index) => ({
    date,
    count: data.daily_counts.counts[index]
  }));

  // Process the monthly data
  const monthlyData = data.monthly_by_category;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Complaint Trends Over Time</CardTitle>
            <CardDescription>Visualizing how complaints change over time</CardDescription>
          </div>
          <div className="rounded-full bg-muted p-2">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly">
          <TabsList className="mb-4 w-full max-w-[400px]">
            <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
            <TabsTrigger value="daily">Daily Trends</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
          </TabsList>
          
          {/* Monthly aggregated line chart */}
          <TabsContent value="monthly" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} complaints`, 'Count']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey={(dataPoint) => {
                    // Sum all category counts for this month
                    let total = 0;
                    data.categories.forEach(cat => {
                      total += (dataPoint[cat] as number) || 0;
                    });
                    return total;
                  }}
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Total Complaints"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Daily line chart */}
          <TabsContent value="daily" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  interval="preserveEnd"
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} complaints`, 'Count']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Daily Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          {/* Stacked bar chart by category */}
          <TabsContent value="by-category" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.categories.map((category, index) => (
                  <Bar 
                    key={category} 
                    dataKey={category} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]} 
                    name={category}
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
