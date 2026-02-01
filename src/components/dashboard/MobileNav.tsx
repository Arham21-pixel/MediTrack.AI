'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, CalendarClock, Users, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
    { icon: Home, label: 'Home', href: '/dashboard', guestAllowed: true },
    { icon: FileText, label: 'Meds', href: '/dashboard/prescriptions', guestAllowed: true },
    { icon: FileText, label: 'Reports', href: '/dashboard/reports', guestAllowed: false },
    { icon: CalendarClock, label: 'Timeline', href: '/dashboard/timeline', guestAllowed: false },
    { icon: Users, label: 'Profile', href: '/dashboard/settings', guestAllowed: false },
];

export function MobileNav() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();

    // Filter nav items based on authentication status
    const visibleNavItems = isAuthenticated 
        ? navItems 
        : navItems.filter(item => item.guestAllowed);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 px-6 py-4 md:hidden z-50 pb-safe">
            <nav className="flex items-center justify-between">
                {visibleNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors relative",
                                isActive ? "text-lime-600 dark:text-lime-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            <div className="relative">
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-indicator"
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime-500 rounded-full"
                                    />
                                )}
                            </div>
                            <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
