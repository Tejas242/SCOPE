'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu 
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
  return (
    <Link href={href} className="w-full">
      <Button
        variant={active ? "secondary" : "ghost"}
        className={`w-full justify-start ${active ? 'bg-muted' : ''}`}
      >
        <span className="mr-2">{icon}</span>
        {label}
      </Button>
    </Link>
  );
};

import { User } from '@/types';

export function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  
  useEffect(() => {
    // Load user from local storage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User);
    }
  }, []);

  const navItems = [
    {
      href: '/dashboard',
      icon: <BarChart3 size={18} />,
      label: 'Dashboard',
    },
    {
      href: '/complaints',
      icon: <FileText size={18} />,
      label: 'Complaints',
    },
    {
      href: '/chat',
      icon: <MessageSquare size={18} />,
      label: 'Chat Assistant',
    },
    {
      href: '/users',
      icon: <Users size={18} />,
      label: 'User Management',
    },
    {
      href: '/settings',
      icon: <Settings size={18} />,
      label: 'Settings',
    },
  ];

  const handleLogout = () => {
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove token from cookies for middleware
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    window.location.href = '/login';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4">
        <h2 className="text-2xl font-bold">SCOPE</h2>
      </div>
      <Separator />
      
      {user && (
        <div className="px-4 py-2 mb-2 mt-2">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>{user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role || 'User'}</p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
          />
        ))}
      </nav>
      
      <div className="p-4">
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut size={18} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-background border-r">
        {sidebarContent}
      </div>
    </>
  );
}
