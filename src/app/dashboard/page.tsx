'use client';

import { useState, useCallback } from 'react';
import { StatsOverview } from '@/components/dashboard/home/StatsOverview';
import { DailyMedicineSchedule } from '@/components/dashboard/home/DailyMedicineSchedule';
import { QuickActions } from '@/components/dashboard/home/QuickActions';
import { RecentAlerts } from '@/components/dashboard/home/RecentAlerts';
import { AdherenceRing } from '@/components/dashboard/home/AdherenceRing';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { TimelinePreview } from '@/components/dashboard/home/TimelinePreview';
import { FamilyMedicineTracker } from '@/components/dashboard/home/FamilyMedicineTracker';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
    const { user } = useAuth();
    const [takenCount, setTakenCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Calculate adherence percentage from actual medicine intake
    const adherencePercentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

    // Callback to receive schedule changes from DailyMedicineSchedule
    const handleScheduleChange = useCallback((taken: number, total: number) => {
        setTakenCount(taken);
        setTotalCount(total);
    }, []);

    // Get user's first name
    const getFirstName = () => {
        if (!user?.name) return '';
        return user.name.split(' ')[0];
    };

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-8 relative pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {getFirstName()}</h1>
                    <p className="text-gray-500 dark:text-gray-400">Here's your health overview for today.</p>
                </div>
                <div className="text-sm font-medium bg-white dark:bg-neutral-900 px-4 py-2 rounded-full shadow-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-neutral-800 self-start md:self-auto transition-colors">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* 1. Stats Overview (Top) */}
            <StatsOverview takenCount={takenCount} totalCount={totalCount} />

            {/* 2. Main Grid: Schedule & Quick Actions/Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Today's Schedule (2 cols wide) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <DailyMedicineSchedule onScheduleChange={handleScheduleChange} />
                    <FamilyMedicineTracker />
                    <TimelinePreview />
                </motion.div>

                {/* Right Column: Quick Actions & Alerts & Adherence (1 col wide) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <AdherenceRing percentage={adherencePercentage} takenCount={takenCount} totalCount={totalCount} />
                    <QuickActions />
                    <RecentAlerts />
                </motion.div>
            </div>

            <FloatingActionButton />
        </div>
    );
}
