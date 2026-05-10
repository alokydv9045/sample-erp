'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Header } from '@/components/layout/header';
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';
import { Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background/95 backdrop-blur-sm">
      <TopAnnouncementBar />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar with collapse support */}
        <div className="hidden lg:flex flex-col">
          <Sidebar className="flex transition-opacity duration-500 ease-in-out" />
        </div>

        {/* Sidebar toggle button — tabs on the edge of sidebar */}
        <MobileSidebar open={isMobileMenuOpen} setOpen={setIsMobileMenuOpen} />

        <div className="flex flex-1 flex-col overflow-hidden w-full max-w-full">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b shadow-sm" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/20 dark:bg-slate-900/10 custom-scrollbar scroll-smooth">{children}</main>
        </div>
      </div>
    </div>
  );
}
