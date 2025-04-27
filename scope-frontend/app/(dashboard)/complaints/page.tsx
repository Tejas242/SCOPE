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
  Trash
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
  }, [categoryFilter, urgencyFilter, statusFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await api.get<Complaint[]>('/api/v1/complaints/');
      let filteredComplaints = response.data;

      if (categoryFilter) {
        filteredComplaints = filteredComplaints.filter((complaint) => 
          complaint.category === categoryFilter
        );
      }

      if (urgencyFilter) {
        filteredComplaints = filteredComplaints.filter((complaint) => 
          complaint.urgency === urgencyFilter
        );
      }

      if (statusFilter) {
        filteredComplaints = filteredComplaints.filter((complaint) => 
          complaint.status === statusFilter
        );
      }

      if (searchTerm) {
        filteredComplaints = filteredComplaints.filter((complaint) =>
          complaint.complaint_text.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setComplaints(filteredComplaints);
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
    fetchComplaints();
  };

  const resetFilters = () => {
    setCategoryFilter(null);
    setUrgencyFilter(null);
    setStatusFilter(null);
    setSearchTerm('');
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Complaints</h1>
        <Button onClick={() => setIsNewComplaintOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Complaint
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            placeholder="Search complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="flex gap-2 flex-wrap">
          <Select 
            value={categoryFilter || ''} 
            onValueChange={(value) => setCategoryFilter(value as ComplaintCategory || null)}
          >
            <SelectTrigger className="w-[150px]">
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
            value={urgencyFilter || ''} 
            onValueChange={(value) => setUrgencyFilter(value as ComplaintUrgency || null)}
          >
            <SelectTrigger className="w-[150px]">
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
            value={statusFilter || ''} 
            onValueChange={(value) => setStatusFilter(value as ComplaintStatus || null)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="icon" onClick={resetFilters}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
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
              complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.id}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {complaint.complaint_text.length > 100
                      ? `${complaint.complaint_text.substring(0, 100)}...`
                      : complaint.complaint_text}
                  </TableCell>
                  <TableCell>
                    {complaint.category ? (
                      <Badge variant="outline">{complaint.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {complaint.urgency ? (
                      <Badge className={getUrgencyColor(complaint.urgency)}>
                        {complaint.urgency}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewComplaint(complaint)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* New Complaint Dialog */}
      <Dialog open={isNewComplaintOpen} onOpenChange={setIsNewComplaintOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Complaint</DialogTitle>
            <DialogDescription>
              Add a new complaint to the system.
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
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Prediction Results</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{prediction.category}</Badge>
                      <Progress value={prediction.confidence_category * 100} className="h-2" />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(prediction.confidence_category * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Urgency</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getUrgencyColor(prediction.urgency)}>
                        {prediction.urgency}
                      </Badge>
                      <Progress value={prediction.confidence_urgency * 100} className="h-2" />
                      <span className="text-xs text-muted-foreground">
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
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
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
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="mr-auto"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateComplaint} disabled={isSubmitting}>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the complaint
              and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComplaint} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
