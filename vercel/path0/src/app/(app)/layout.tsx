
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
    // This is the single source of truth for protecting routes.
    // If auth state is resolved and there is NO user, redirect to login.
    if (!isUserLoading && !user) {
      router.push('/');
      return;
    }

    // Only handle device-specific redirects if a user is confirmed.
    if (!isUserLoading && user && typeof isMobile === 'boolean') {
        const isDesktopOnMobilePage = !isMobile && (pathname === '/scan');
        const isMobileOnDesktopPage = isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'));
        
        if (isDesktopOnMobilePage) {
            router.push('/dashboard');
        } else if (isMobileOnDesktopPage) {
            router.push('/scan');
        }
    }
  }, [user, isUserLoading, router, isMobile, pathname]);
  
  // While we are waiting for the auth state to resolve, show a full-screen loader.
  // This prevents the flicker by not rendering the child components until auth is confirmed.
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // After loading, if there's still no user, the useEffect will handle the redirect.
  // Render null to prevent a flash of content before the redirect happens.
  if (!user) {
    return null;
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
