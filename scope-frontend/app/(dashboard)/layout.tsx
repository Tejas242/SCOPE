import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
          <main className="flex-1 px-4 py-8 md:px-8">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
