'use client';

import { Upload, FileText, Bell, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function QuickActions() {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-lime-50 dark:bg-lime-900/10 border border-lime-100 dark:border-lime-900/30 group hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-lime-500 text-white flex items-center justify-center mb-2 shadow-lime-200 dark:shadow-none group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Upload Rx</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 group hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-2 shadow-blue-200 dark:shadow-none group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Upload Report</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium text-gray-600 dark:text-gray-300 text-sm">Add Med</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Bell size={24} />
                    </div>
                    <span className="font-medium text-gray-600 dark:text-gray-300 text-sm">Reminder</span>
                </motion.button>
            </div>
        </div>
    );
}
