"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FlaskConical,
  Boxes,
  Wrench,
  Beaker,
  BookOpen,
  FlaskRound,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/equipment", label: "Equipment", icon: Wrench },
  { href: "/results", label: "Results", icon: Beaker },
  { href: "/literature-review", label: "AI Review", icon: BookOpen },
];

export default function SidebarNav({ isMobile = false }) {
    const pathname = usePathname();

    const navContent = (
        <>
            <SidebarHeader>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <FlaskRound className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold font-headline text-sidebar-foreground">LabFlow</h1>
                </Link>
            </SidebarHeader>

            <SidebarMenu>
                {links.map((link) => (
                    <SidebarMenuItem key={link.href}>
                        <Link href={link.href} passHref legacyBehavior>
                            <SidebarMenuButton asChild isActive={pathname === link.href}>
                                <a>
                                    <link.icon className="h-4 w-4" />
                                    <span>{link.label}</span>
                                </a>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>

            <SidebarFooter>
                <Card className="bg-sidebar-accent border-sidebar-border">
                    <CardHeader className="p-2 pt-0 md:p-4">
                        <h3 className="text-lg font-semibold text-sidebar-accent-foreground">Upgrade Plan</h3>
                        <p className="text-xs text-sidebar-foreground/80">Unlock all features and get unlimited access to our support team.</p>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                        <Button size="sm" className="w-full">Upgrade</Button>
                    </CardContent>
                </Card>
            </SidebarFooter>
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