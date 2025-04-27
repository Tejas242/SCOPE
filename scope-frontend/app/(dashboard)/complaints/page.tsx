'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText,  
  Search, 
  X, 
  Loader2, 
  AlertCircle, 
  Plus, 
  Save,
  Trash,
  MessageSquare
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { showToast } from '@/lib/toast';
import { 
  Complaint,
  ComplaintCategory,
  ComplaintUrgency, 
  ComplaintStatus,
  ComplaintPrediction,
  ApiError 
} from '@/types';

const CATEGORIES: ComplaintCategory[] = ['Academic', 'Facilities', 'Housing', 'IT Support', 'Financial Aid', 'Campus Life', 'Other'];
const URGENCIES: ComplaintUrgency[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: ComplaintStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

interface EditFormData {
  complaint_text: string;
  category: string;
  urgency: string;
  status: string;
  assigned_to: string;
  response: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<ComplaintUrgency | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [newComplaintText, setNewComplaintText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [prediction, setPrediction] = useState<ComplaintPrediction | null>(null);
  
  const [editFormData, setEditFormData] = useState<EditFormData>({
    complaint_text: '',
    category: '',
    urgency: '',
    status: '',
    assigned_to: '',
    response: ''
  });

  useEffect(() => {
    fetchComplaints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, urgencyFilter, statusFilter, currentPage, pageSize]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      // Build query parameters for API request
      const params = new URLSearchParams();
      
      // Add pagination parameters
      params.append('skip', ((currentPage - 1) * pageSize).toString());
      params.append('limit', pageSize.toString());
      
      // Add filter parameters
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      
      if (urgencyFilter) {
        params.append('urgency', urgencyFilter);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      // Fetch complaints with server-side filtering and pagination
      const response = await api.get<{items: Complaint[], total: number}>(
        `/api/v1/complaints/?${params.toString()}`
      );
      
      // Update total count and complaints
      setTotalComplaints(response.data.total);
      setComplaints(response.data.items);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchComplaints();
  };

  const resetFilters = () => {
    setCategoryFilter(null);
    setUrgencyFilter(null);
    setStatusFilter(null);
    setSearchTerm('');
    setCurrentPage(1);
    fetchComplaints();
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsEditDialogOpen(true);
    setEditFormData({
      complaint_text: complaint.complaint_text,
      category: complaint.category || '',
      urgency: complaint.urgency || '',
      status: complaint.status,
      assigned_to: complaint.assigned_to || '',
      response: complaint.response || ''
    });
  };
  
  // Alias for handleViewComplaint for better semantic naming when clicking on complaint text
  const handleEdit = handleViewComplaint;

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/api/v1/complaints/${selectedComplaint.id}`);
      
      setIsDeleteConfirmOpen(false);
      setIsEditDialogOpen(false);
      showToast('success', "Complaint deleted", "The complaint has been successfully deleted");
      fetchComplaints();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to delete complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      setIsSubmitting(true);
      await api.put<Complaint>(
        `/api/v1/complaints/${selectedComplaint.id}`,
        {
          complaint_text: editFormData.complaint_text,
          category: editFormData.category || null,
          urgency: editFormData.urgency || null,
          status: editFormData.status,
          assigned_to: editFormData.assigned_to || null,
          response: editFormData.response || null
        }
      );
      
      setIsEditDialogOpen(false);
      showToast('success', "Complaint updated", "The complaint has been successfully updated");
      fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to update complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrediction = async () => {
    if (!newComplaintText.trim()) return;

    try {
      setPredictionLoading(true);
      const response = await api.post<ComplaintPrediction>(
        '/api/v1/complaints/classify',
        { complaint_text: newComplaintText }
      );
      
      setPrediction(response.data);
    } catch (error) {
      console.error('Error getting prediction:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to get prediction');
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleCreateComplaint = async () => {
    if (!newComplaintText.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post<Complaint>('/api/v1/complaints/', { complaint_text: newComplaintText });
      
      setIsNewComplaintOpen(false);
      setNewComplaintText('');
      setPrediction(null);
      showToast('success', "Complaint created", "The new complaint has been successfully created");
      fetchComplaints();
    } catch (error) {
      console.error('Error creating complaint:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to create complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-500';
      case 'In Progress': return 'bg-yellow-500';
      case 'Resolved': return 'bg-green-500';
      case 'Closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute -top-12 -left-8 h-16 w-80 bg-blue-500/10 blur-2xl rounded-full -z-10"></div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
            <p className="text-muted-foreground mt-1">Manage and track student complaints</p>
          </div>
          <Button 
            onClick={() => setIsNewComplaintOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" /> New Complaint
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card border rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-muted-foreground mr-1">Filters:</span>
            <Select 
              value={categoryFilter || 'all'} 
              onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value as ComplaintCategory)}
            >
              <SelectTrigger className="w-[150px] h-9 bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={urgencyFilter || 'All'} 
              onValueChange={(value) => setUrgencyFilter(value === 'All' ? null : value as ComplaintUrgency)}
            >
              <SelectTrigger className="w-[150px] h-9 bg-background">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Urgencies</SelectItem>
                {URGENCIES.map((urgency) => (
                  <SelectItem key={urgency} value={urgency}>{urgency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={statusFilter || 'All'} 
              onValueChange={(value) => setStatusFilter(value === 'All' ? null : value as ComplaintStatus)}
            >
              <SelectTrigger className="w-[150px] h-9 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={resetFilters} className="h-9">
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        </div>
      </div>

      <div className=" overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">No.</TableHead>
              <TableHead>Complaint</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-2" />
                    <p>No complaints found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint, index) => (
                <TableRow key={complaint.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell className="max-w-md truncate">
                    <div className="font-medium hover:text-primary cursor-pointer" onClick={() => handleEdit(complaint)}>
                      {complaint.complaint_text.length > 80
                        ? `${complaint.complaint_text.substring(0, 80)}...`
                        : complaint.complaint_text}
                    </div>
                  </TableCell>
                  <TableCell>
                    {complaint.category ? (
                      <Badge variant="outline" className="bg-background font-medium">
                        {complaint.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {complaint.urgency ? (
                      <Badge className={`${getUrgencyColor(complaint.urgency)} text-white`}>
                        {complaint.urgency}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(complaint.status)} text-white`}>
                      {complaint.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(complaint.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewComplaint(complaint)}
                      className="h-8 px-3 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-t gap-4">
          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md">
            Showing <span className="font-medium text-foreground">{complaints.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
            {Math.min(currentPage * pageSize, totalComplaints)}</span> of <span className="font-medium text-foreground">{totalComplaints}</span> complaints
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center border rounded-md overflow-hidden bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-none h-9 border-r"
              >
                Previous
              </Button>
              
              <div className="flex items-center text-sm px-4 border-r h-9 bg-muted/20">
                <span className="text-muted-foreground mr-1">Page</span> 
                <span className="font-medium">{currentPage}</span> 
                <span className="text-muted-foreground mx-1">of</span> 
                <span className="font-medium">{Math.ceil(totalComplaints / pageSize)}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => 
                  setCurrentPage((prev) => 
                    Math.min(prev + 1, Math.ceil(totalComplaints / pageSize))
                  )
                }
                disabled={currentPage >= Math.ceil(totalComplaints / pageSize)}
                className="rounded-none h-9"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Enhancement */}
      {!loading && complaints.length === 0 && !error && (
        <div className="bg-muted/20 rounded-lg p-8 text-center my-6">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No complaints found</h3>
            <p className="text-muted-foreground mb-6">
              There are no complaints matching your current filters. Try changing your search criteria or create a new complaint.
            </p>
            <Button onClick={() => setIsNewComplaintOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create a New Complaint
            </Button>
          </div>
        </div>
      )}

      {/* New Complaint Dialog */}
      <Dialog open={isNewComplaintOpen} onOpenChange={setIsNewComplaintOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Complaint</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new complaint to the system for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="complaint-text">Complaint Details</Label>
              <Textarea
                id="complaint-text"
                placeholder="Enter detailed complaint description..."
                value={newComplaintText}
                onChange={(e) => {
                  setNewComplaintText(e.target.value);
                  setPrediction(null);
                }}
                className="min-h-32"
              />
            </div>
            
            <div className="flex justify-between gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={getPrediction} 
                disabled={!newComplaintText.trim() || predictionLoading}
              >
                {predictionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Predict Category & Urgency
              </Button>
            </div>
            
            {prediction && (
              <div className="border rounded-lg p-5 bg-background shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <h4 className="font-semibold text-base">AI Prediction Results</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-muted/30 p-4 rounded-md">
                    <p className="text-sm font-medium mb-2">Category Prediction</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="bg-background font-medium">
                        {prediction.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={prediction.confidence_category * 100} 
                        className="h-2"
                      />
                      <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">
                        {Math.round(prediction.confidence_category * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-md">
                    <p className="text-sm font-medium mb-2">Urgency Prediction</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${getUrgencyColor(prediction.urgency)} text-white`}>
                        {prediction.urgency}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={prediction.confidence_urgency * 100} 
                        className="h-2"
                      />
                      <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">
                        {Math.round(prediction.confidence_urgency * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsNewComplaintOpen(false);
                setNewComplaintText('');
                setPrediction(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateComplaint}
              disabled={!newComplaintText.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Complaint Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>
              View and update complaint information.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="response">
                <MessageSquare className="h-4 w-4 mr-2" />
                Response
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-complaint-text">Complaint Text</Label>
                <Textarea
                  id="edit-complaint-text"
                  value={editFormData.complaint_text}
                  onChange={(e) => setEditFormData({...editFormData, complaint_text: e.target.value})}
                  className="min-h-32"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={editFormData.category} 
                    onValueChange={(value) => setEditFormData({...editFormData, category: value})}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-urgency">Urgency</Label>
                  <Select 
                    value={editFormData.urgency} 
                    onValueChange={(value) => setEditFormData({...editFormData, urgency: value})}
                  >
                    <SelectTrigger id="edit-urgency">
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCIES.map((urgency) => (
                        <SelectItem key={urgency} value={urgency}>{urgency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editFormData.status} 
                    onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-assigned">Assigned To</Label>
                  <Input
                    id="edit-assigned"
                    value={editFormData.assigned_to}
                    onChange={(e) => setEditFormData({...editFormData, assigned_to: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="response" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-response">Response</Label>
                <Textarea
                  id="edit-response"
                  placeholder="Enter response to this complaint..."
                  value={editFormData.response}
                  onChange={(e) => setEditFormData({...editFormData, response: e.target.value})}
                  className="min-h-32"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0 pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="mr-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Complaint
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)} 
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateComplaint} 
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="border border-red-200 dark:border-red-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash className="h-5 w-5" />
              Delete Complaint
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the complaint
              and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteComplaint} 
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, delete complaint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
