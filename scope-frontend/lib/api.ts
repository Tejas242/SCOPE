import axios, { AxiosError } from 'axios';
import { ApiError } from '@/types';

// Use relative URLs to access Next.js API routes
const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in all requests
// No need to manually set Authorization header when using API routes as they
// automatically include the token from cookies on server-side
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage user data
      localStorage.removeItem('user');
      
      // Call our logout API endpoint to clear the server-side token cookie
      try {
        await axios.post('/api/v1/auth/logout');
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
      }
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    const apiError: ApiError = {
      status: error.response?.status || 500,
      data: error.response?.data as { detail?: string; message?: string },
      message: error.message
    };
    
    return Promise.reject(apiError);
  }
);

export default api;
