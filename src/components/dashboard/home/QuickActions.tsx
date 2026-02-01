'use client';

import { Upload, FileText, Sparkles, ArrowRight, ScanText, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function QuickActions() {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
            {/* Header with AI Badge */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Simplify your healthcare documents</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-200 dark:border-lime-800">
                    <Sparkles size={12} className="text-lime-600 dark:text-lime-400" />
                    <span className="text-[10px] font-semibold text-lime-700 dark:text-lime-400">AI Powered</span>
                </div>
            </div>

            <div className="space-y-3">
                {/* Upload Prescription - Featured Card */}
                <Link href="/upload?type=prescription">
                    <motion.div
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 p-4 group cursor-pointer shadow-lg shadow-lime-500/20 dark:shadow-lime-500/10"
                    >
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8"></div>
                        
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ScanText size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-base">Upload Prescription</h3>
                                <p className="text-lime-100 text-xs mt-0.5">Instantly decode handwritten Rx</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 group-hover:translate-x-1 transition-all">
                                <ArrowRight size={16} className="text-white" />
                            </div>
                        </div>
                        
                        {/* Feature Tags */}
                        <div className="relative z-10 flex gap-2 mt-3 pt-3 border-t border-white/20">
                            <span className="text-[10px] font-medium text-white/90 bg-white/15 px-2 py-0.5 rounded-full">Auto-extract medicines</span>
                            <span className="text-[10px] font-medium text-white/90 bg-white/15 px-2 py-0.5 rounded-full">Drug interactions</span>
                        </div>
                    </motion.div>
                </Link>

                {/* Upload Report - Secondary Card */}
                <Link href="/upload-report">
                    <motion.div
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 group cursor-pointer shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
                    >
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8"></div>
                        
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileSearch size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-base">Upload Lab Report</h3>
                                <p className="text-blue-100 text-xs mt-0.5">Understand results in plain English</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 group-hover:translate-x-1 transition-all">
                                <ArrowRight size={16} className="text-white" />
                            </div>
                        </div>
                        
                        {/* Feature Tags */}
                        <div className="relative z-10 flex gap-2 mt-3 pt-3 border-t border-white/20">
                            <span className="text-[10px] font-medium text-white/90 bg-white/15 px-2 py-0.5 rounded-full">AI Summary</span>
                            <span className="text-[10px] font-medium text-white/90 bg-white/15 px-2 py-0.5 rounded-full">Health insights</span>
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* Bottom Tip */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-1 h-1 rounded-full bg-lime-500"></div>
                <span>Drag & drop or tap to upload any medical document</span>
            </div>
        </div>
    );
}
