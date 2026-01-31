'use client';

import { Pill, FileText, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function StatsOverview() {
    const stats = [
        { label: 'Total Scripts', value: '12', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
        { label: 'Active Meds', value: '4', icon: Pill, color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-50 dark:bg-lime-900/10' },
        { label: 'Upcoming', value: '3', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
        { label: 'Adherence', value: '92%', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4 transition-colors"
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        <stat.icon size={20} />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
