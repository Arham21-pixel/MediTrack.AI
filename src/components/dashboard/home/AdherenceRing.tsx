'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface AdherenceRingProps {
    percentage: number;
    takenCount: number;
    totalCount: number;
}

export function AdherenceRing({ percentage, takenCount, totalCount }: AdherenceRingProps) {
    // Start at 0 and cap at 100 maximum
    const adherencePercentage = Math.min(Math.max(percentage, 0), 100);
    
    const data = [
        { name: 'Taken', value: adherencePercentage },
        { name: 'Remaining', value: 100 - adherencePercentage },
    ];

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col items-center justify-center relative h-[300px] transition-colors">
            <h3 className="absolute top-6 left-6 font-bold text-gray-900 dark:text-gray-100 text-lg">Daily Adherence</h3>

            <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            cornerRadius={10}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#84cc16' : '#262626'} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <motion.div
                        key={adherencePercentage}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-extrabold text-gray-900 dark:text-white"
                    >
                        {adherencePercentage}%
                    </motion.div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">Completed</div>
                </div>
            </div>

            <div className="absolute bottom-6 text-sm text-gray-500 dark:text-gray-400">
                {takenCount} of {totalCount} medicines taken today
            </div>
        </div>
    );
}
