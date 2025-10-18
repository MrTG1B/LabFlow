
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
    if (!isUserLoading && !user) {
      router.push('/');
    } else if (!isUserLoading && user) {
        // Redirect logic is now in the page, but keeping this as a fallback
        const isDesktopOnMobilePage = !isMobile && (window.location.pathname === '/scan');
        const isMobileOnDesktopPage = isMobile && (window.location.pathname !== '/scan' && !window.location.pathname.startsWith('/inventory') && !window.location.pathname.startsWith('/vendors') && !window.location.pathname.startsWith('/literature-review') && !window.location.pathname.startsWith('/settings'));
        
        if (isDesktopOnMobilePage) {
            router.push('/dashboard');
        } else if (isMobileOnDesktopPage) {
            router.push('/scan');
        }
    }
  }, [user, isUserLoading, router, isMobile]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

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
