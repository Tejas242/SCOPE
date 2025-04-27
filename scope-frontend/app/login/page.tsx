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
    // Check if user is already logged in from localStorage
    // We're using cookies now for the token, but we still use localStorage for user data
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Create FormData object - OAuth2PasswordRequestForm expects form data, not JSON
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      // Actually make the API request to login
      await axios.post<LoginResponse>(
        '/api/v1/auth/login',
        formData
      );
      
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
      
      // Show redirecting state
      setIsRedirecting(true);
      
      // Show success message
      showToast('success', 'Login Successful', 'Redirecting to dashboard...');
      
      // Redirect to dashboard after a short delay to allow state update and cookie to be set
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
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
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      {/* Gradient Accent */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4 border">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
            </div>
            <p className="text-lg font-medium">Login successful!</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
      
      <div className="container flex flex-col lg:flex-row items-center justify-center max-w-screen-xl relative z-10">
        {/* Left side branding */}
        <div className="w-full lg:w-1/2 p-6 lg:pr-12 space-y-6 mb-8 lg:mb-0 text-center lg:text-left">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to SCOPE</h1>
            <div className="h-1 w-16 bg-primary mx-auto lg:mx-0"></div>
          </div>
          <p className="text-xl text-muted-foreground">
            Student Complaint Organization & Prioritization Engine
          </p>
          <p className="text-muted-foreground">
            The intelligent platform that streamlines complaint management for educational institutions.
          </p>
        </div>
        
        {/* Right side login form */}
        <div className="w-full lg:w-1/2 p-4">
          <Card className="w-full max-w-md mx-auto border shadow-lg relative">
            <CardHeader className="space-y-1 border-b pb-7 pt-7">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="relative z-10">
                <div className="grid gap-5">
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
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-11"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 mt-2" 
                    disabled={isLoading || isRedirecting}
                  >
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
            <CardFooter className="flex flex-col border-t pt-6">
              <p className="text-xs text-center text-muted-foreground">
                This is a demo application. Use <span className="font-mono bg-muted px-1 py-0.5 rounded">admin@scope.edu / password123</span> to login as admin.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}