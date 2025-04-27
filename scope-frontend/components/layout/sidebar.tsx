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
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import LogoutButton from './logout-button';

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
        variant="ghost"
        className={`w-full justify-start hover:bg-primary/10 transition-all ${
          active 
            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none' 
            : ''
        }`}
      >
        <span className="mr-3">{icon}</span>
        {label}
      </Button>
    </Link>
  );
};

import { User } from '@/types';

export function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    // Load user from local storage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User);
    }
    
    // Load sidebar state from localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed));
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

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Toggle button component
  const ToggleButton = () => (
    <Button
      variant={collapsed ? "outline" : "secondary"}
      size="icon"
      className={`h-8 w-8 rounded-md ${collapsed ? 'border-muted bg-background' : 'border border-primary/20'} hover:bg-muted/80`}
      onClick={toggleCollapse}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <PanelLeftOpen size={16} className="text-primary" />
      ) : (
        <PanelLeftClose size={16} className="text-primary" />
      )}
    </Button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background">
      {/* App Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center py-6' : 'p-6'}`}>
        <div className={`flex items-center ${collapsed ? '' : 'gap-2'}`}>
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">S</div>
          {!collapsed && <h2 className="text-xl font-bold tracking-tight">SCOPE</h2>}
        </div>
      </div>
      <Separator />
      
      {/* User Profile */}
      {user && (
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-3 mb-2 mt-2`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} bg-muted/40 p-3 rounded-lg`}>
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="space-y-1">
                <p className="text-sm font-medium">{user.full_name || user.email.split('@')[0]}</p>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div>
                  <p className="text-xs text-muted-foreground capitalize">{user.role || 'User'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Navigation */}
      {!collapsed && (
        <div className="px-3 py-2">
          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Menu
          </p>
        </div>
      )}
      
      <nav className={`flex-1 ${collapsed ? 'px-1' : 'px-2'} py-1 space-y-0.5`}>
        {navItems.map((item) => (
          collapsed ? (
            <Link key={item.href} href={item.href} className="w-full block">
              <Button
                variant="ghost"
                className={`w-full justify-center py-3 hover:bg-primary/10 transition-all ${
                  pathname === item.href 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : ''
                }`}
                title={item.label}
              >
                {item.icon}
              </Button>
            </Link>
          ) : (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
            />
          )
        ))}
      </nav>
      
      {/* Footer with logout and toggle buttons */}
      <div className={`${collapsed ? 'px-2 py-4' : 'p-4'} mt-auto`}>
        <div className={`flex ${collapsed ? 'flex-col' : 'flex-row justify-between'} items-center gap-2`}>
          {/* When collapsed, toggle button goes above logout button */}
          {collapsed && <ToggleButton />}
          
          {/* Logout button takes full width in expanded mode */}
          <div className={!collapsed ? 'flex-1' : ''}>
            <LogoutButton textLabel={!collapsed} />
          </div>
          
          {/* When expanded, toggle button goes next to logout button */}
          {!collapsed && <ToggleButton />}
        </div>
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

      {/* Desktop navigation - will-change property helps with transition performance */}
      <div className={`hidden md:flex ${collapsed ? 'md:w-16' : 'md:w-64'} md:flex-col md:fixed md:inset-y-0 bg-background border-r transition-all duration-200 ease-in-out will-change-transform will-change-width overflow-hidden`}>
        {sidebarContent}
      </div>
    </>
  );
}
