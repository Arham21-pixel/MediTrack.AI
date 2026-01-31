'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, CalendarClock, Users, Settings, LogOut, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Prescriptions', href: '/dashboard/prescriptions' },
    { icon: FileText, label: 'Reports', href: '/dashboard/reports' }, // Added Reports
    { icon: CalendarClock, label: 'Timeline', href: '/dashboard/timeline' },
    { icon: Users, label: 'Family', href: '/dashboard/family' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' }, // Profile is effectively here or we can add a dedicated one
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 bg-white dark:bg-neutral-900 border-r border-gray-100 dark:border-neutral-800 flex flex-col items-center py-6 z-40 hidden md:flex shadow-sm transition-colors duration-300">
            <Link href="/" className="mb-10 w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-lime-950 shadow-md shadow-lime-200">
                <Activity size={24} />
            </Link>

            <nav className="flex-1 w-full flex flex-col items-center gap-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group relative",
                                isActive
                                    ? "bg-lime-100 text-lime-700 shadow-sm"
                                    : "text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-gray-100"
                            )}
                        >
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                            {/* Tooltip */}
                            <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors mt-auto" title="Log Out">
                <LogOut size={20} />
            </Link>
        </aside>
    );
}
