'use client';

import { Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface LabValueProps {
    name: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    optimalMin: number;
    optimalMax: number;
    description: string;
}

export function LabGauge({ data }: { data: LabValueProps }) {
    // Calculate position percentage
    const range = data.max - data.min;
    const position = ((data.value - data.min) / range) * 100;

    // Determine status color
    const isOptimal = data.value >= data.optimalMin && data.value <= data.optimalMax;
    const statusColor = isOptimal ? 'text-lime-600' : 'text-orange-500';

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{data.name}</h4>
                        <div className="group relative">
                            <Info size={14} className="text-gray-300 hover:text-gray-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {data.description}
                            </div>
                        </div>
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${statusColor}`}>
                        {data.value} <span className="text-sm text-gray-400 font-medium">{data.unit}</span>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${isOptimal ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isOptimal ? 'Normal' : 'Attention'}
                </span>
            </div>

            {/* Linear Gauge */}
            <div className="relative h-2 w-full bg-gray-100 rounded-full mb-2 overflow-hidden">
                {/* Optimal Zone */}
                <div
                    className="absolute top-0 bottom-0 bg-lime-200 opacity-50"
                    style={{
                        left: `${((data.optimalMin - data.min) / range) * 100}%`,
                        width: `${((data.optimalMax - data.optimalMin) / range) * 100}%`
                    }}
                />

                {/* Value Marker */}
                <motion.div
                    initial={{ left: 0 }}
                    animate={{ left: `${Math.min(100, Math.max(0, position))}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`absolute top-0 bottom-0 w-2 h-2 rounded-full -ml-1 shadow-sm border border-white ${isOptimal ? 'bg-lime-500' : 'bg-orange-500 scale-125'}`}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-400 font-mono">
                <span>{data.min}</span>
                <span>{data.optimalMin} - {data.optimalMax}</span>
                <span>{data.max}</span>
            </div>
        </div>
    );
}
