
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
    if (!isUserLoading && user) {
        const isDesktopOnMobilePage = !isMobile && (pathname === '/scan');
        const isMobileOnDesktopPage = isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'));
        
        if (isDesktopOnMobilePage) {
            router.push('/dashboard');
        } else if (isMobileOnDesktopPage) {
            router.push('/scan');
        }
    }
  }, [user, isUserLoading, router, isMobile, pathname]);
  
  // While the user's auth state is loading, show a full-screen spinner.
  // This is crucial to prevent any content from rendering before the user is confirmed.
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If loading is done AND there's a user, render the app layout.
  // If there's NO user, the useEffect will have already initiated the redirect,
  // so we render null to prevent a flash of the layout.
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
