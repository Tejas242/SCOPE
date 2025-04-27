import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import axios from 'axios';
import { showToast } from '@/lib/toast';

export default function LogoutButton({ textLabel = true }: { textLabel?: boolean }) {
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
      variant="outline"
      onClick={handleLogout}
      className={`w-full ${textLabel ? 'justify-start' : 'justify-center'} border-primary/20 hover:bg-primary/5 hover:text-primary group`}
      title="Sign Out"
    >
      <LogOut className={`${textLabel ? 'mr-2' : ''} h-4 w-4 group-hover:text-primary transition-colors`} />
      {textLabel && "Sign Out"}
    </Button>
  );
}
