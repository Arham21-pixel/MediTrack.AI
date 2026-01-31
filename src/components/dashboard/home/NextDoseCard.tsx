'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NextDoseCard() {
    const [isTaken, setIsTaken] = useState(false);

    return (
        <div className="bg-gray-900 dark:bg-black rounded-3xl p-8 shadow-xl shadow-gray-200 dark:shadow-none dark:border dark:border-neutral-800 text-white relative overflow-hidden h-[300px] flex flex-col justify-between group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-lime-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity duration-500 group-hover:opacity-50" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border ${isTaken ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-lime-500/20 text-lime-400 border-lime-500/20'}`}>
                            {isTaken ? <Check size={12} /> : <Clock size={12} />} {isTaken ? 'Completed' : 'Next Dose'}
                        </span>
                        <h3 className="text-3xl font-bold mb-1">Amoxicillin</h3>
                        <p className="text-gray-400 text-lg">500mg • 1 Tablet</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isTaken ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                        {isTaken ? <Check size={24} /> : <Pill size={24} />}
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-auto">
                <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-1">Scheduled For</div>
                    <div className="text-2xl font-mono font-bold text-white">8:00 PM</div>
                </div>

                <motion.button
                    whileHover={!isTaken ? { scale: 1.02 } : {}}
                    whileTap={!isTaken ? { scale: 0.98 } : {}}
                    onClick={() => setIsTaken(!isTaken)}
                    className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${isTaken
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-lime-500 hover:bg-lime-400 text-gray-900'
                        }`}
                >
                    <Check size={20} className="stroke-[3px]" />
                    {isTaken ? 'Taken' : 'Mark as Taken'}
                </motion.button>
            </div>
        </div>
    );
}
