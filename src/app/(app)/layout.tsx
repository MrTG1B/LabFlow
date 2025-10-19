
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
  const isMobile = useIsMobile(); // Initializes as undefined

  // --- START: New Redirect Logic ---

  // 1. We are in a "loading" state if auth is checking OR if mobile is detecting.
  const isStillLoading = isUserLoading || typeof isMobile !== 'boolean';

  // 2. Handle auth redirects *immediately* when auth state is known
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  // 3. Handle mobile redirects *only after* all loading is done
  useEffect(() => {
    // Wait for all checks to complete
    if (isStillLoading) {
      return;
    }

    // User is guaranteed to exist here because of the gate below
    if (user) {
      const isDesktopOnMobilePage = !isMobile && (pathname === '/scan');
      const isMobileOnDesktopPage = isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'));
      
      if (isDesktopOnMobilePage) {
        router.push('/dashboard');
      } else if (isMobileOnDesktopPage) {
        router.push('/scan');
      }
    }
  }, [isStillLoading, user, isMobile, pathname, router]);

  
  // --- Strict Loading Gate (The Fix) ---
  // Show spinner if *any* check is pending (auth OR mobile).
  // Also show spinner if auth is done but there is no user
  // (because the useEffect above is redirecting).
  if (isStillLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // --- Mobile Redirect Gate ---
  // Before rendering, do a final check. If a mobile redirect is needed,
  // show the loader to prevent rendering the wrong page for one frame.
  if (isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // --- Render App ---
  // Only when auth is stable, a user exists, and we are on the
  // correct page for the device, render the full app layout.
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
