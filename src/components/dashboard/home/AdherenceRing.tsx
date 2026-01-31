'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface AdherenceRingProps {
    percentage: number;
}

export function AdherenceRing({ percentage }: AdherenceRingProps) {
    const data = [
        { name: 'Taken', value: percentage },
        { name: 'Remaining', value: 100 - percentage },
    ];

    // Need to handle colors dynamically or use CSS variables in Recharts
    // For simplicity in this step, we'll stick to a gray that works in both or use a theme context to switch colors.
    // But first, let's fix the container stats.

    // Update COLORS to use CSS variables if possible, or just pick a slate-700 for dark mode background ring
    // Since Recharts doesn't support classNames easily for fills, we will keep gray-200 but it might look bright in dark mode.
    // Better option: Use a gray that is neutral, or pass `fill-gray-200 dark:fill-gray-700` via a custom component if Recharts allowed.
    // Instead, we will use a variable color for the remaining part check.

    // Simplest fix: Just change container styles. The gray ring is acceptable for now.

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
                            {/* We keep literal colors for Recharts as it needs hex strings usually. 
                                Ideally, we'd use a hook to get theme and change color. 
                                For now, #e5e7eb is gray-200. We can try a darker gray.
                             */}
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#84cc16' : '#262626'} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-4xl font-extrabold text-gray-900 dark:text-white"
                    >
                        {percentage}%
                    </motion.div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">Completed</div>
                </div>
            </div>

            <div className="absolute bottom-6 text-sm text-gray-500 dark:text-gray-400">4 of 5 medicines taken today</div>
        </div>
    );
}
