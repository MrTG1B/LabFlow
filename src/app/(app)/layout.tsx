
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
    // Redirect logic should only run once the auth state is fully resolved.
    if (isUserLoading) {
      return; // Wait until loading is finished
    }

    // If loading is done and there's still no user, redirect to login.
    if (!user) {
      router.push('/');
      return;
    }

    // Handle device-specific redirects only when we have a confirmed user.
    if (typeof isMobile === 'boolean') {
        const isDesktopOnMobilePage = !isMobile && (pathname === '/scan');
        const isMobileOnDesktopPage = isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'));
        
        if (isDesktopOnMobilePage) {
            router.push('/dashboard');
        } else if (isMobileOnDesktopPage) {
            router.push('/scan');
        }
    }
  }, [user, isUserLoading, router, isMobile, pathname]);
  
  // This is the crucial loading gate.
  // We will show a loader if the user state is still loading OR if, after loading,
  // there is no user object yet (which can happen for a brief moment before the redirect effect kicks in).
  // This prevents any child components from rendering prematurely.
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
