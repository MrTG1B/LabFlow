
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from "@/components/header";
import SidebarNav from "@/components/sidebar-nav";
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only run redirect logic after the initial auth check is complete.
    if (!isUserLoading) {
      // If auth is resolved and there is still no user, redirect to login.
      if (!user) {
        router.push('/');
        return;
      }
      
      // Handle device-specific redirects only when a user is confirmed.
      if (typeof isMobile === 'boolean') {
          const isDesktopOnMobilePage = !isMobile && (pathname === '/scan');
          const isMobileOnDesktopPage = isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'));
          
          if (isDesktopOnMobilePage) {
              router.push('/dashboard');
          } else if (isMobileOnDesktopPage) {
              router.push('/scan');
          }
      }
    }
  }, [user, isUserLoading, router, isMobile, pathname]);
  
  // Strict Loading Gate:
  // While we are waiting for the auth state to resolve, OR if there is no user
  // after loading, show a full-screen loader. This prevents flicker by not
  // rendering child components until auth is fully confirmed and stable.
  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // Only when auth is stable and a user exists, render the full app layout.
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-4 md:p-8 lg:p-10 bg-background/95">
            {children}
          </main>
          <Toaster />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
