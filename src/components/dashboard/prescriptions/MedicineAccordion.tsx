'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pill, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    purpose: string;
    instructions: string[];
}

export function MedicineAccordion({ medicine }: { medicine: Medicine }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <Pill size={20} />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-gray-900">{medicine.name}</div>
                        <div className="text-xs text-gray-500">{medicine.dosage} • {medicine.frequency}</div>
                    </div>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-50 bg-gray-50/50"
                    >
                        <div className="p-4 space-y-4">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Purpose</span>
                                <p className="text-gray-700 text-sm mt-1">{medicine.purpose}</p>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instructions</span>
                                <ul className="mt-1 space-y-1">
                                    {medicine.instructions.map((inst, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                                            {inst}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs">
                                <AlertCircle size={14} className="mt-0.5" />
                                <p>Take with food to avoid stomach upset.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
