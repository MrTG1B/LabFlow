
"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Boxes,
  BookOpen,
  CircuitBoard,
  ScanLine,
  Users,
  Settings,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const desktopLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/vendors", label: "Vendors", icon: Users },
  { href: "/literature-review", label: "AI Review", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileLinks = [
    { href: "/scan", label: "Scan", icon: ScanLine },
    { href: "/inventory", label: "Inventory", icon: Boxes },
    { href: "/vendors", label: "Vendors", icon: Users },
    { href: "/literature-review", label: "AI Review", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
]

export default function SidebarNav({ isMobile = false }) {
    const pathname = usePathname();
    const links = useIsMobile() ? mobileLinks : desktopLinks;

    const navContent = (
        <>
            <SidebarHeader>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <CircuitBoard className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold font-headline text-sidebar-foreground">Degen Technologies</h1>
                </Link>
            </SidebarHeader>

            <SidebarMenu>
                {links.map((link) => (
                    <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton asChild isActive={pathname === link.href}>
                            <Link href={link.href}>
                                <link.icon className="h-4 w-4" />
                                <span>{link.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </>
    );

    if (isMobile) {
        return (
            <nav className="grid gap-2 text-lg font-medium">
                {navContent}
            </nav>
        );
    }
    
    return navContent;
}
