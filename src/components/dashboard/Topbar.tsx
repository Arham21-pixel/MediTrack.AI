'use client';

import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Topbar() {
    return (
        <header className="h-16 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search prescriptions, medicines, or reports..."
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 focus:bg-white dark:focus:bg-neutral-900 transition-all text-sm outline-none placeholder:text-gray-400 dark:text-gray-100"
                    />
                </div>
                <span className="md:hidden font-bold text-lg text-gray-900 dark:text-white">Dashboard</span>
            </div>

            <div className="flex items-center gap-2">
                <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
                </button>

                <div className="h-8 w-px bg-gray-200 dark:bg-neutral-800 mx-2 hidden md:block"></div>

                <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="hidden md:block text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">John Doe</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Premium Plan</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-800">
                        <User size={16} />
                    </div>
                </button>
            </div>
        </header>
    );
}
