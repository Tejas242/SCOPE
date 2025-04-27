'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Plus,  
  Save, 
  Loader2, 
  AlertCircle, 
  Users
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { showToast } from '@/lib/toast';
import { User, UserRole, ApiError } from '@/types';

interface NewUserForm {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  is_active: boolean;
}

interface EditUserForm {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  is_active: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    email: '',
    full_name: '',
    password: '',
    role: 'student',
    is_active: true
  });
  
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    email: '',
    full_name: '',
    password: '',
    role: 'student',
    is_active: true
  });
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>('/api/v1/users/');
      
      const filteredUsers = searchTerm 
        ? response.data.filter((user) => 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : response.data;
        
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Get current user role
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user) as User;
      setCurrentUserRole(userData.role as UserRole);
      
      // If not admin, redirect to dashboard
      if (userData.role !== 'admin') {
        router.push('/dashboard');
      }
    }

    fetchUsers();
  }, [router]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async () => {
    try {
      setIsSubmitting(true);
      await api.post<User>('/api/v1/users/', newUserForm);
      
      setIsNewUserDialogOpen(false);
      setNewUserForm({
        email: '',
        full_name: '',
        password: '',
        role: 'student',
        is_active: true
      });
      showToast('success', "User created", "The user has been successfully created");
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      email: user.email,
      full_name: user.full_name || '',
      password: '', // Don't include current password
      role: (user.role as UserRole) || 'student',
      is_active: user.is_active
    });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Only include password if it's been changed
    const updateData = {
      ...editUserForm,
      password: editUserForm.password.trim() === '' ? undefined : editUserForm.password
    };

    try {
      setIsSubmitting(true);
      await api.put<User>(`/api/v1/users/${selectedUser.id}`, updateData);
      
      setIsEditUserDialogOpen(false);
      showToast('success', "User updated", "The user has been successfully updated");
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/api/v1/users/${selectedUser.id}`);
      
      setIsDeleteConfirmOpen(false);
      showToast('success', "User deleted", "The user has been successfully deleted");
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'staff': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // If not admin, don't show the page
  if (currentUserRole && currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => setIsNewUserDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-10 w-10 mb-2" />
                    <p>No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role || 'No role'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => confirmDeleteUser(user)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* New User Dialog */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newUserForm.role} 
                onValueChange={(value) => setNewUserForm({...newUserForm, role: value as UserRole})}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={newUserForm.is_active}
                onCheckedChange={(checked : boolean) => setNewUserForm({...newUserForm, is_active: checked})}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsNewUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={!newUserForm.email || !newUserForm.password || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editUserForm.full_name}
                onChange={(e) => setEditUserForm({...editUserForm, full_name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_password">Password (Leave blank to keep unchanged)</Label>
              <Input
                id="edit_password"
                type="password"
                value={editUserForm.password}
                onChange={(e) => setEditUserForm({...editUserForm, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select 
                value={editUserForm.role} 
                onValueChange={(value) => setEditUserForm({...editUserForm, role: value as UserRole})}
              >
                <SelectTrigger id="edit_role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit_is_active"
                checked={editUserForm.is_active}
                onCheckedChange={(checked : boolean) => setEditUserForm({...editUserForm, is_active: checked})}
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={!editUserForm.email || isSubmitting}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
