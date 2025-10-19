
'use client';
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
import { useEffect } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const isAuthLoading = isUserLoading;
  const isMobileDetecting = typeof isMobile !== 'boolean';

  // --- 1. Primary Loading State ---
  const isLoading = isAuthLoading || isMobileDetecting;

  useEffect(() => {
    // Only perform redirects once all loading is complete
    if (!isLoading) {
      // --- 2. Auth Gate ---
      // If loading is done and there's no user, it's a protected route. Redirect.
      if (!user) {
        router.push('/');
        return; // Exit early
      }

      // --- 3. Mobile Redirect Gate ---
      // At this point, we know a user exists. Check for device/page mismatch.
      const isDesktopOnMobilePage = !isMobile && (pathname === '/scan');
      const isMobileOnDesktopPage = isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'));
      
      if (isDesktopOnMobilePage) {
        router.push('/dashboard');
      } else if (isMobileOnDesktopPage) {
        router.push('/scan');
      }
    }
  }, [isLoading, user, isMobile, pathname, router]);

  // --- Final Render Gate ---
  // Show a loader if we are still loading OR if there's no user
  // (which means a redirect is in progress). This prevents rendering children.
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // --- Render App ---
  // All checks passed. User is authenticated and on the correct page.
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
