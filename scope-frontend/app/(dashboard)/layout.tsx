'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load sidebar collapsed state
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }
    
    // Add event listener for sidebar collapse changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarCollapsed') {
        setSidebarCollapsed(JSON.parse(e.newValue || 'false'));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    // More efficient way to check for sidebar state changes
    const handleSidebarChange = () => {
      const value = localStorage.getItem('sidebarCollapsed');
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed !== sidebarCollapsed) {
          setSidebarCollapsed(parsed);
        }
      }
    };
    
    // Use MutationObserver to detect DOM changes that might indicate sidebar state changes
    const observer = new MutationObserver(handleSidebarChange);
    observer.observe(document.body, { subtree: true, childList: true });
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, [sidebarCollapsed]);

  return (
    <>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Improved transition with will-change property */}
        <div 
          className={`${sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'} flex flex-col flex-1 min-h-screen transition-all duration-200 ease-out will-change-[padding]`}
        >
          <ScrollArea className="flex-1">
            <main className="flex-1 px-4 py-3 md:px-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </ScrollArea>
        </div>
      </div>
      <Toaster />
    </>
  );
}
