'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, UserRole } from '@/types';
import { showToast } from '@/lib/toast';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // Add redirecting state
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Create FormData object - OAuth2PasswordRequestForm expects form data, not JSON
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post<LoginResponse>(
        'http://localhost:8000/api/v1/auth/login',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Save token to localStorage
      localStorage.setItem('token', response.data.access_token);
      
      // Since we don't have a /me endpoint in the backend, we'll create a simplified user object
      // We can identify the user type based on the email in this demo app
      let role: UserRole = 'student';
      if (email.includes('admin')) {
        role = 'admin';
      } else if (email.includes('staff')) {
        role = 'staff';
      }
      
      // Create a basic user object
      const user: User = {
        id: 1,
        email: email,
        full_name: email.split('@')[0],
        role: role,
        is_active: true
      };
      
      // Save user info to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set token in cookie for middleware
      document.cookie = `token=${response.data.access_token}; path=/`;
      
      // Show redirecting state
      setIsRedirecting(true);
      
      // Show success message
      showToast('success', 'Login Successful', 'Redirecting to dashboard...');
      
      // Redirect to dashboard after a short delay to allow state update
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const axiosError = error as AxiosError<{ detail: string }>;
      
      const errorMessage = axiosError.response?.data?.detail || 'Failed to login. Please check your credentials and try again.';
      setError(errorMessage);
      showToast('error', 'Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
      // Don't reset redirecting state here, as it should stay true if login was successful
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">SCOPE</CardTitle>
          <CardDescription className="text-center">
            Student Complaint Organizing & Processing Engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to dashboard...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="mt-2 text-xs text-center text-gray-500">
            This is a demo application. Use admin@scope.edu / password123 to login as admin.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}