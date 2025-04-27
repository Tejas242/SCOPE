'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Save, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { showToast } from '@/lib/toast';
import { User, ApiError } from '@/types';
import { CacheRevalidation } from '@/components/dashboard/CacheRevalidation';

interface ProfileForm {
  email: string;
  full_name: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function SettingsPage() {
  // Removed useToast
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    email: '',
    full_name: '',
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  useEffect(() => {
    // Get user info from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser) as User;
      setUser(userData);
      setProfileForm({
        email: userData.email || '',
        full_name: userData.full_name || '',
      });
    }
  }, []);
  
  const updateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Update local storage with new data
      const updatedUser: User = {
        ...user,
        email: profileForm.email,
        full_name: profileForm.full_name,
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      showToast('success', 'Profile updated', 'Your profile has been successfully updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const updatePassword = async () => {
    if (!user) return;
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.put(`/api/v1/users/${user.id}`, {
        password: passwordForm.new_password,
      });
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      showToast('success', 'Password updated', 'Your password has been successfully updated');
    } catch (error) {
      console.error('Error updating password:', error);
      const apiError = error as ApiError;
      setError(apiError.data?.detail || apiError.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          {user?.role === 'admin' && <TabsTrigger value="system">System</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role || ''} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={updateProfile} disabled={loading}>
                {loading ? (
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
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={updatePassword}
                disabled={
                  loading || 
                  !passwordForm.current_password || 
                  !passwordForm.new_password || 
                  !passwordForm.confirm_password
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {user?.role === 'admin' && (
          <TabsContent value="system">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">System Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage system-level settings and cache for optimal performance.
                </p>
              </div>
              <Separator />
              <CacheRevalidation />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
