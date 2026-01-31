'use client';

import { StatsOverview } from '@/components/dashboard/home/StatsOverview';
import { DailyMedicineSchedule } from '@/components/dashboard/home/DailyMedicineSchedule';
import { QuickActions } from '@/components/dashboard/home/QuickActions';
import { RecentAlerts } from '@/components/dashboard/home/RecentAlerts';
import { AdherenceRing } from '@/components/dashboard/home/AdherenceRing';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    return (
        <div className="space-y-8 relative pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Good Morning, John</h1>
                    <p className="text-gray-500 dark:text-gray-400">Here's your health overview for today.</p>
                </div>
                <div className="text-sm font-medium bg-white dark:bg-neutral-900 px-4 py-2 rounded-full shadow-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-neutral-800 self-start md:self-auto transition-colors">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* 1. Stats Overview (Top) */}
            <StatsOverview />

            {/* 2. Main Grid: Schedule & Quick Actions/Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Today's Schedule (2 cols wide) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <DailyMedicineSchedule />

                    {/* Placeholder for Timeline Preview - Keeping it simpler for now */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Health Timeline</h2>
                            <button className="text-sm font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</button>
                        </div>
                        <div className="space-y-0">
                            {[1, 2].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 dark:border-neutral-800 last:border-0 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        LAB
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">Blood Test Report</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Analyzed by AI • 2 hours ago</div>
                                    </div>
                                    <div className="text-xs font-medium text-gray-400">View</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Quick Actions & Alerts & Adherence (1 col wide) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <AdherenceRing percentage={92} />
                    <QuickActions />
                    <RecentAlerts />
                </motion.div>
            </div>

            <FloatingActionButton />
        </div>
    );
}
