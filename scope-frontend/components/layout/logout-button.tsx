import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import axios from 'axios';
import { showToast } from '@/lib/toast';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call our Next.js API route to logout
      await axios.post('/api/v1/auth/logout');
      
      // Clear user data from localStorage
      localStorage.removeItem('user');
      
      // Show success message
      showToast('success', 'Logout successful', 'Redirecting to login page...');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      showToast('error', 'Logout failed', 'Please try again');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="w-full justify-start"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
