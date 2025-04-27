import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WordFrequency } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from 'react';
import { CloudIcon } from 'lucide-react';

interface WordFrequencyChartProps {
  data: WordFrequency[] | null;
  loading: boolean;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658',
  '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#a4506c', '#9e67ab'
];

export default function WordFrequencyChart({ data, loading }: WordFrequencyChartProps) {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Word Frequency</CardTitle>
          <CardDescription>Loading word frequency data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Word Frequency</CardTitle>
          <CardDescription>Most common words in complaints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">No word frequency data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort data by count for bar chart
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  const handleWordMouseOver = (index: number) => {
    setActiveWordIndex(index);
  };

  const handleWordMouseLeave = () => {
    setActiveWordIndex(null);
  };
  
  // Create a word cloud-like visualization
  const maxCount = Math.max(...data.map(d => d.count));
  const minCount = Math.min(...data.map(d => d.count));
  const range = maxCount - minCount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Word Frequency Analysis</CardTitle>
            <CardDescription>Most common words in complaint texts</CardDescription>
          </div>
          <div className="rounded-full bg-muted p-2">
            <CloudIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar">
          <TabsList className="mb-4 w-full max-w-[400px]">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            <TabsTrigger value="cloud">Word Cloud</TabsTrigger>
          </TabsList>
          
          {/* Bar Chart View */}
          <TabsContent value="bar" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData.slice(0, 15)}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="word" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  interval={0} 
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} occurrences`, 'Frequency']}
                  labelFormatter={(label) => `Word: ${label}`}
                />
                <Bar dataKey="count" name="Frequency">
                  {sortedData.slice(0, 15).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      opacity={activeWordIndex === null || activeWordIndex === index ? 1 : 0.3}
                      onMouseOver={() => handleWordMouseOver(index)}
                      onMouseLeave={handleWordMouseLeave}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          {/* Pie Chart View */}
          <TabsContent value="pie" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value) => [`${value} occurrences`, 'Frequency']} />
                <Pie
                  data={sortedData.slice(0, 10)}
                  dataKey="count"
                  nameKey="word"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ word, count, percent }) => 
                    `${word} (${count}, ${(percent * 100).toFixed(1)}%)`
                  }
                  labelLine={false}
                >
                  {sortedData.slice(0, 10).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
          
          {/* Word Cloud View */}
          <TabsContent value="cloud">
            <div className="flex flex-wrap justify-center gap-3 p-6 h-[400px] overflow-auto">
              {sortedData.slice(0, 30).map((word, index) => {
                // Calculate size based on frequency
                const sizeRatio = (word.count - minCount) / range;
                const fontSize = 0.8 + sizeRatio * 1.5; // Font size between 0.8rem and 2.3rem
                
                return (
                  <div
                    key={index}
                    className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                    style={{ 
                      fontSize: `${fontSize}rem`,
                      opacity: 0.7 + sizeRatio * 0.3,
                      color: COLORS[index % COLORS.length]
                    }}
                  >
                    {word.word}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
