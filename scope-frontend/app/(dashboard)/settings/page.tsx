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
      <div className="relative">
        <div className="absolute -top-12 -left-8 h-16 w-80 bg-blue-500/10 blur-2xl rounded-full -z-10"></div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your profile and application preferences</p>
          </div>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11 mb-4">
          <TabsTrigger value="profile" className="rounded-md">
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="rounded-md">
            Password
          </TabsTrigger>
          {user?.role === 'admin' && <TabsTrigger value="system" className="rounded-md">System</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>Profile Information</div>
              </CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name" className="font-medium">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Your full name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Role</Label>
                <div className="flex items-center">
                  <div className="h-10 px-3 bg-muted/50 border rounded-md flex items-center">
                    <span className="capitalize">{user?.role || 'Student'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground ml-3">Role cannot be changed</div>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Your profile information will be used throughout the application.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/30 px-6 py-4 flex justify-end">
              <Button 
                onClick={updateProfile} 
                disabled={loading}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>Password Security</div>
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="current_password" className="font-medium">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  className="h-10"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">New Password</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_password" className="font-medium">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="font-medium">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  className="h-10"
                />
                <p className="text-sm text-muted-foreground">
                  Make sure to use a strong, unique password that you do not use elsewhere.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/30 px-6 py-4 flex justify-end">
              <Button
                onClick={updatePassword}
                disabled={
                  loading || 
                  !passwordForm.current_password || 
                  !passwordForm.new_password || 
                  !passwordForm.confirm_password
                }
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
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
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                      <path d="m9.5 11.5 5 5" />
                      <path d="M14.5 11.5v5h-5" />
                      <path d="M3 6v10a3 3 0 0 0 3 3h10" />
                      <path d="M14 3h7v7" />
                    </svg>
                  </div>
                  <div>System Management</div>
                </CardTitle>
                <CardDescription>
                  Manage system-level settings and cache for optimal performance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-lg mb-6 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 mr-2">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div>
                    <p className="font-medium text-amber-800 mb-1">Administrator Access</p>
                    <p className="text-sm text-amber-700">
                      These settings affect the entire application. Changes made here will impact all users.
                    </p>
                  </div>
                </div>
                <CacheRevalidation />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
