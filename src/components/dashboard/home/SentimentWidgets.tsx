'use client';

import { Activity, TrendingUp, HeartPulse } from 'lucide-react';

export function SentimentIndicator() {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col h-[140px] justify-between transition-colors">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Health Status</h3>
                <HeartPulse className="text-lime-500" size={24} />
            </div>

            <div>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">Great</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Stable trends</span>
                </div>

                <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-lime-500 rounded-full"></div>
                    <div className="flex-1 bg-lime-500 rounded-full"></div>
                    <div className="flex-1 bg-lime-500 rounded-full"></div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}

export function QuickStats() {
    return (
        <div className="grid grid-cols-2 gap-4 h-[140px]">
            <div className="bg-lime-50 dark:bg-lime-900/10 rounded-3xl p-5 border border-lime-100 dark:border-lime-900/30 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 flex items-center justify-center shadow-sm">
                    <Activity size={16} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">98%</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Adherence</div>
                </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl p-5 border border-blue-100 dark:border-blue-900/30 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                    <TrendingUp size={16} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">4</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Scripts</div>
                </div>
            </div>
        </div>
    )
}
