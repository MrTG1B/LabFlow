
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

  // --- 1. Primary Loading Gate ---
  // Show a loader if *either* auth is checking OR we are
  // still detecting the device type.
  if (isAuthLoading || isMobileDetecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // --- 2. Auth Gate ---
  // After *all* loading is done, check for a user.
  // If no user exists, this is a protected route. Redirect to login.
  if (!user) {
    // We push inside render and return a loader. This is the
    // fix that breaks the useEffect loop.
    router.push('/');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // --- 3. Mobile Redirect Gate ---
  // At this point, we *know* a user exists and all loading is done.
  // Now, we just check if they are on the wrong page for their device.
  const isDesktopOnMobilePage = !isMobile && (pathname === '/scan');
  const isMobileOnDesktopPage = isMobile && (pathname !== '/scan' && !pathname.startsWith('/inventory') && !pathname.startsWith('/vendors') && !pathname.startsWith('/literature-review') && !pathname.startsWith('/settings'));
  
  if (isDesktopOnMobilePage) {
    router.push('/dashboard');
    return ( // Show loader while redirecting
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  } else if (isMobileOnDesktopPage) {
    router.push('/scan');
    return ( // Show loader while redirecting
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // --- 4. Render App ---
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
