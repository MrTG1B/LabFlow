
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const isMobile = useIsMobile();

  useEffect(() => {
    // When auth state is resolved, and there is no user, redirect to login page.
    if (!isUserLoading && !user) {
      router.push('/');
    } else if (!isUserLoading && user) {
        // Handle device-specific redirects once we know a user is logged in.
        const isDesktopOnMobilePage = !isMobile && (window.location.pathname === '/scan');
        const isMobileOnDesktopPage = isMobile && (window.location.pathname !== '/scan' && !window.location.pathname.startsWith('/inventory') && !window.location.pathname.startsWith('/vendors') && !window.location.pathname.startsWith('/literature-review') && !window.location.pathname.startsWith('/settings'));
        
        if (isDesktopOnMobilePage) {
            router.push('/dashboard');
        } else if (isMobileOnDesktopPage) {
            router.push('/scan');
        }
    }
    // The dependency array ensures this effect runs only when auth state changes.
  }, [user, isUserLoading, router, isMobile]);
  
  // While the user's auth state is loading, show a spinner.
  // This prevents the "glitch" of showing content before the user is confirmed.
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If loading is done and there's a user, render the app layout.
  // If there's no user, the useEffect will have already initiated the redirect.
  // Rendering null here prevents a flash of the layout before the redirect completes.
  return user ? (
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
  ) : null;
}
