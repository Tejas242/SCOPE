import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClusterData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CircleDashed } from 'lucide-react';

interface ClusterVisualizationProps {
  data: ClusterData | null;
  loading: boolean;
}

// Generate distinct colors for each cluster
const generateClusterColors = (numClusters: number) => {
  const baseColors = [
    '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0', 
    '#33FFF0', '#F0FF33', '#FF8C33', '#33FF8C', '#8C33FF'
  ];
  
  // If we have more clusters than base colors, we'll cycle through them
  return Array(numClusters).fill(0).map((_, i) => baseColors[i % baseColors.length]);
};

export default function ClusterVisualization({ data, loading }: ClusterVisualizationProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complaint Clusters</CardTitle>
          <CardDescription>Loading cluster data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.complaint_ids.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complaint Clusters</CardTitle>
          <CardDescription>No cluster data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">No clustering data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format cluster data for visualization
  const formattedData: { x: number; y: number; cluster: string; category: string }[] = [];
  
  for (let i = 0; i < data.complaint_ids.length; i++) {
    formattedData.push({
      x: data.coordinates.x[i],
      y: data.coordinates.y[i],
      cluster: `Cluster ${data.cluster_labels[i]}`,
      category: data.categories[i]
    });
  }

  // Group data by clusters for selective rendering
  const clusterGroups: Record<string, typeof formattedData> = {};
  formattedData.forEach(item => {
    if (!clusterGroups[item.cluster]) {
      clusterGroups[item.cluster] = [];
    }
    clusterGroups[item.cluster].push(item);
  });
  
  const clusterColors = generateClusterColors(Object.keys(clusterGroups).length);

  // Handle cluster selection
  const handleClusterClick = (cluster: string) => {
    setSelectedCluster(selectedCluster === cluster ? null : cluster);
  };
  
  // Get number of unique clusters
  const numClusters = new Set(data.cluster_labels).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Complaint Clusters</CardTitle>
            <CardDescription>
              AI-powered grouping of similar complaints into {numClusters} clusters
            </CardDescription>
          </div>
          <div className="rounded-full bg-muted p-2">
            <CircleDashed className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            This visualization uses AI to group similar complaints together. Each point represents 
            a complaint, and complaints that are close to each other have similar content. The colors 
            represent different automatically detected clusters.
          </p>
        </div>

        <Tabs defaultValue="visualization">
          <TabsList className="mb-4 w-full max-w-[400px]">
            <TabsTrigger value="visualization">Cluster Visualization</TabsTrigger>
            <TabsTrigger value="insights">Cluster Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualization">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x"
                      name="Component 1" 
                      domain={['auto', 'auto']}
                      label={{ 
                        value: 'Principal Component 1', 
                        position: 'bottom',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Component 2"
                      domain={['auto', 'auto']}
                      label={{ 
                        value: 'Principal Component 2', 
                        position: 'left',
                        angle: -90,
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <ZAxis range={[60, 60]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : value, name]}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border shadow-sm rounded-md">
                              <p className="font-medium">{data.cluster}</p>
                              <p className="text-sm text-muted-foreground">Category: {data.category}</p>
                              <p className="text-sm">X: {data.x.toFixed(2)}, Y: {data.y.toFixed(2)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      payload={
                        Object.keys(clusterGroups).map((cluster, index) => ({
                          value: cluster,
                          type: 'circle',
                          id: cluster,
                          color: clusterColors[index % clusterColors.length]
                        }))
                      }
                      wrapperStyle={{ paddingTop: "10px" }}
                      onClick={(e) => handleClusterClick(e.value)}
                    />
                    {Object.keys(clusterGroups).map((cluster, index) => {
                      // If a cluster is selected, only show that cluster with full opacity
                      // otherwise show all clusters
                      const shouldRender = !selectedCluster || selectedCluster === cluster;
                      const opacity = selectedCluster && selectedCluster !== cluster ? 0.3 : 1;
                      
                      return shouldRender && (
                        <Scatter
                          key={cluster}
                          name={cluster}
                          data={clusterGroups[cluster]}
                          fill={clusterColors[index % clusterColors.length]}
                          opacity={opacity}
                        />
                      );
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div className="lg:col-span-1">
                <div className="border rounded-md p-3 h-[450px] overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-2">Cluster Selection</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on a cluster below to highlight it in the chart.
                  </p>
                  <div className="space-y-3">
                    {Object.keys(clusterGroups).map((cluster, index) => {
                      const isSelected = selectedCluster === cluster;
                      
                      return (
                        <div 
                          key={cluster}
                          className={`p-2 border rounded-md cursor-pointer transition-colors ${
                            isSelected ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleClusterClick(cluster)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: clusterColors[index % clusterColors.length] }}
                            ></div>
                            <span className="font-medium">{cluster}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {clusterGroups[cluster].length} complaints
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.cluster_insights && Object.entries(data.cluster_insights).map(([clusterId, insight]) => {
                const colorIndex = parseInt(clusterId, 10) % clusterColors.length;
                
                return (
                  <div key={clusterId} className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: clusterColors[colorIndex] }}
                      ></div>
                      <h3 className="text-lg font-medium">Cluster {clusterId}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Size</div>
                        <div className="text-xl font-semibold">{insight.size}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground">Top Category</div>
                        <Badge variant="outline">{insight.top_category}</Badge>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Sample Complaints:</h4>
                      <ul className="space-y-2">
                        {insight.samples.map((sample, idx) => (
                          <li key={idx} className="text-xs bg-muted/50 p-2 rounded-md">
                            &quot;{sample.length > 100 ? `${sample.substring(0, 100)}...` : sample}&quot;
                          </li>
                        ))}
                      </ul>
                    </div>
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
