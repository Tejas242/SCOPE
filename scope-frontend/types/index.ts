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
  open_complaints: number;
  critical_urgency: number;
  avg_response_time?: number;
}

export interface TimeTrend {
  month: string;
  count: number;
}

export interface CategoryRelationships {
  category_counts: Record<ComplaintCategory, number>;
}

export interface WordFrequency {
  word: string;
  count: number;
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
