// User related types
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole | null;
  is_active: boolean;
}

export type UserRole = 'admin' | 'staff' | 'student';

// Complaint related types
export interface Complaint {
  id: number;
  complaint_text: string;
  category: ComplaintCategory | null;
  urgency: ComplaintUrgency | null;
  created_at: string;
  updated_at: string;
  status: ComplaintStatus;
  assigned_to: string | null;
  response: string | null;
}

export type ComplaintCategory = 'Academic' | 'Facilities' | 'Housing' | 'IT Support' | 'Financial Aid' | 'Campus Life' | 'Other';
export type ComplaintUrgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface ComplaintPrediction {
  category: ComplaintCategory;
  urgency: ComplaintUrgency;
  confidence_category: number;
  confidence_urgency: number;
}

// Chat related types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Dashboard stats types
export interface BasicStats {
  total_complaints: number;
  by_category: Record<string, number>;
  by_urgency: Record<string, number>;
  by_status: Record<string, number>;
  response_rate: number;
  assigned_rate: number;
}

export interface DailyTrend {
  dates: string[];
  counts: number[];
}

export interface MonthlyTrendItem {
  month: string;
  [category: string]: string | number;
}

export interface TimeTrends {
  daily_counts: DailyTrend;
  monthly_by_category: MonthlyTrendItem[];
  categories: string[];
}

export interface CategoryTable {
  categories: string[];
  urgency_levels?: string[];
  statuses?: string[];
  data: number[][];
}

export interface CategoryRelationships {
  category_urgency: CategoryTable;
  category_status: CategoryTable;
}

export interface WordFrequency {
  word: string;
  count: number;
}

// New types for clustering and topic analysis
export interface ClusterData {
  complaint_ids: number[];
  categories: string[];
  urgencies: string[];
  cluster_labels: number[];
  coordinates: {
    x: number[];
    y: number[];
  };
  cluster_insights: {
    [key: string]: {
      size: number;
      top_category: string;
      samples: string[];
    };
  };
}

export interface TopicDocument {
  id: number;
  text: string;
  score: number;
}

export interface Topic {
  id: number;
  top_words: string[];
  documents: TopicDocument[];
  weight: number;
}

export interface DocumentTopic {
  id: number;
  text: string;
  topics: {
    id: number;
    score: number;
  }[];
}

export interface TopicsData {
  topics: Topic[];
  document_topics: DocumentTopic[];
  topic_term_matrix: number[][];
}

// Error handling
export interface ApiError {
  status: number;
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
}
