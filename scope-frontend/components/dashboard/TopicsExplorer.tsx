import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TopicsData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface TopicsExplorerProps {
  data: TopicsData | null;
  loading: boolean;
}

// Colors for different topics
const COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0', 
  '#33FFF0', '#F0FF33', '#FF8C33', '#33FF8C', '#8C33FF'
];

export default function TopicsExplorer({ data, loading }: TopicsExplorerProps) {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topic Modeling</CardTitle>
          <CardDescription>Loading topic data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.topics.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topic Modeling</CardTitle>
          <CardDescription>No topic data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">No topic modeling data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate weight percentages for visualization
  const topicWeights = data.topics.map(topic => ({
    name: `Topic ${topic.id + 1}`,
    weight: Math.round(topic.weight * 100),
    id: topic.id
  }));

  const handleTopicClick = (topicId: number) => {
    setSelectedTopic(selectedTopic === topicId ? null : topicId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Topic Modeling</CardTitle>
            <CardDescription>
              AI-identified topics from complaint texts
            </CardDescription>
          </div>
          <div className="rounded-full bg-muted p-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            Topic modeling groups complaints based on underlying themes discovered by AI. 
            Each topic is represented by key words that indicate what the topic is about. 
            This can help identify common themes across complaints that might not be obvious 
            from categories alone.
          </p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4 w-full max-w-[500px]">
            <TabsTrigger value="overview">Topic Overview</TabsTrigger>
            <TabsTrigger value="details">Topic Details</TabsTrigger>
            <TabsTrigger value="documents">Topic Documents</TabsTrigger>
          </TabsList>
          
          {/* Topic Overview - Distribution visualization */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topicWeights}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    barSize={40}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      scale="point" 
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Topic Weight (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }} 
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Weight']}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar 
                      dataKey="weight" 
                      name="Topic Weight" 
                      onClick={(data) => handleTopicClick(data.id)}
                    >
                      {topicWeights.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          opacity={selectedTopic === null || selectedTopic === entry.id ? 1 : 0.4}
                          cursor="pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="lg:col-span-1">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-3">What is Topic Modeling?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Topic modeling is an AI technique that discovers abstract &quot;topics&quot; in a collection 
                    of documents. Each topic is characterized by a group of frequently co-occurring words.
                  </p>
                  
                  <h4 className="text-md font-semibold mb-2">How to interpret:</h4>
                  <ul className="list-disc pl-4 text-sm space-y-2">
                    <li>
                      <span className="font-medium">Topic weight:</span> Indicates how prevalent a topic is 
                      across all complaints
                    </li>
                    <li>
                      <span className="font-medium">Topic words:</span> The most representative words for 
                      each topic
                    </li>
                    <li>
                      <span className="font-medium">Documents:</span> Complaint texts strongly associated 
                      with each topic
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Topic Details - Word clouds for each topic */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.topics.map((topic, topicIndex) => (
                <div 
                  key={topic.id} 
                  className="border rounded-md p-4"
                  style={{ 
                    borderLeft: `4px solid ${COLORS[topicIndex % COLORS.length]}` 
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">
                      Topic {topic.id + 1}
                    </h3>
                    <div className="text-sm">
                      Weight: <span className="font-medium">{(topic.weight * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Top Words:</h4>
                    <div className="flex flex-wrap gap-2">
                      {topic.top_words.map((word, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 rounded-full text-sm"
                          style={{ 
                            backgroundColor: `${COLORS[topicIndex % COLORS.length]}20`,
                            color: COLORS[topicIndex % COLORS.length],
                            opacity: 1 - (idx * 0.05),
                            fontSize: `${Math.max(0.8, 1 - idx * 0.03)}rem` 
                          }}
                        >
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sample Documents:</h4>
                    <ul className="space-y-2">
                      {topic.documents.slice(0, 2).map((doc) => (
                        <li 
                          key={doc.id} 
                          className="text-xs p-2 rounded-md"
                          style={{ 
                            backgroundColor: `${COLORS[topicIndex % COLORS.length]}10` 
                          }}
                        >
                          {doc.text}
                          <div className="mt-1">
                            <Progress 
                              value={doc.score * 100} 
                              className="h-1" 
                              style={{ backgroundColor: `${COLORS[topicIndex % COLORS.length]}20` }}
                            />
                            <div className="text-right text-[10px] mt-1 text-muted-foreground">
                              Relevance: {(doc.score * 100).toFixed(1)}%
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Document View - Show documents and their topic assignments */}
          <TabsContent value="documents">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {data.document_topics.map((doc) => (
                  <div key={doc.id} className="border rounded-md p-3">
                    <div className="text-sm mb-2">{doc.text}</div>
                    
                    <div className="text-xs text-muted-foreground mb-1">Topics:</div>
                    <div className="flex flex-wrap gap-2">
                      {doc.topics.map((topicAssignment) => (
                        <div 
                          key={topicAssignment.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                          style={{ 
                            backgroundColor: `${COLORS[topicAssignment.id % COLORS.length]}15`,
                            color: COLORS[topicAssignment.id % COLORS.length]
                          }}
                        >
                          <span>Topic {topicAssignment.id + 1}</span>
                          <span className="text-[10px] opacity-80">
                            ({(topicAssignment.score * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
