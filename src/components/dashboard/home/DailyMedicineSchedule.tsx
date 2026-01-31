'use client';

import { useState } from 'react';
import { Sun, Moon, Sunrise, Sunset, Check, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

const SCHEDULE = [
    { id: 1, name: 'Amoxicillin', dose: '500mg', time: '08:00 AM', period: 'Morning', icon: Sunrise, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
    { id: 2, name: 'Vitamin D', dose: '1000IU', time: '01:00 PM', period: 'Afternoon', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
    { id: 3, name: 'Metformin', dose: '500mg', time: '08:00 PM', period: 'Evening', icon: Sunset, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
    { id: 4, name: 'Melatonin', dose: '3mg', time: '10:00 PM', period: 'Night', icon: Moon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
];

export function DailyMedicineSchedule() {
    const [taken, setTaken] = useState<number[]>([]);

    const toggleTaken = (id: number) => {
        if (taken.includes(id)) {
            setTaken(taken.filter(i => i !== id));
        } else {
            setTaken([...taken, id]);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Schedule</h2>
                <span className="text-xs font-medium bg-lime-100 text-lime-700 px-2 py-1 rounded-full">{taken.length}/{SCHEDULE.length} Taken</span>
            </div>

            <div className="space-y-3">
                {SCHEDULE.map((item) => {
                    const isTaken = taken.includes(item.id);
                    return (
                        <motion.div
                            layout
                            key={item.id}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 ${isTaken ? 'bg-lime-50 dark:bg-lime-900/10 border-lime-200 dark:border-lime-900/30' : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-lime-200 dark:hover:border-neutral-700'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                                <item.icon size={18} />
                            </div>

                            <div className="flex-1">
                                <div className={`font-bold text-sm ${isTaken ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {item.name}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">{item.dose} • {item.time}</div>
                            </div>

                            <button
                                onClick={() => toggleTaken(item.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isTaken ? 'bg-lime-500 text-white shadow-lg shadow-lime-200 dark:shadow-none' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:bg-lime-100 hover:text-lime-600'}`}
                            >
                                {isTaken ? <Check size={16} strokeWidth={3} /> : <Circle size={16} />}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
