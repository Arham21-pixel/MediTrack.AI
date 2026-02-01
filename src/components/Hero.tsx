'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight, Upload, PlayCircle, Activity } from 'lucide-react';
import { FlipWords } from '@/components/ui/flip-words';

export function Hero() {
    const flipWords = ["Prescriptions", "Lab Reports", "Health Data", "Medications"];
    
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white dark:bg-black transition-colors duration-500">
            {/* Minimalist Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lime-100/40 via-white to-white dark:from-lime-900/20 dark:via-black dark:to-black pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-neutral-800 to-transparent opacity-50" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 text-sm font-medium mb-8 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                            </span>
                            AI-Powered Health Companion
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-gray-900 dark:text-white leading-[0.95] mb-8"
                    >
                        Understand Your <br className="hidden md:block" />
                        <FlipWords words={flipWords} className="text-lime-500" />
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
                    >
                        MediTrack AI transforms messy prescriptions and complex lab reports into clear, actionable health insights. Stay on top of your meds effortlessly.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full h-12 px-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold text-base transition-all shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                Upload Prescription
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900 font-medium text-base gap-2">
                            <PlayCircle size={18} />
                            See Demo
                        </Button>
                    </motion.div>
                </div>

                {/* Modern Glassmorphic Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 50 }}
                    className="relative max-w-6xl mx-auto perspective-1000"
                >
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-[#0F0F0F] border border-gray-200 dark:border-neutral-800">
                        {/* Browser Bar */}
                        <div className="bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800 p-4 flex items-center justify-between backdrop-blur-sm">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                            </div>
                            <div className="flex-1 max-w-md mx-auto bg-white dark:bg-black/40 rounded-full h-7 border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
                                <div className="text-[10px] text-gray-400 font-mono">meditrack.ai/dashboard</div>
                            </div>
                            <div className="w-16"></div>
                        </div>

                        {/* Dashboard Preview Content */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-[500px] md:min-h-[600px] bg-gray-50 dark:bg-[#050505]">
                            {/* Abstract Sidebar */}
                            <div className="hidden md:block md:col-span-2 border-r border-gray-200/50 dark:border-neutral-800 p-6">
                                <div className="space-y-6">
                                    <div className="h-8 w-8 rounded-xl bg-lime-400/20"></div>
                                    <div className="space-y-4 pt-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`h-2 w-full rounded-full ${i === 1 ? 'bg-gray-800 dark:bg-gray-600' : 'bg-gray-200 dark:bg-neutral-800'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="col-span-12 md:col-span-10 p-8">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <div className="h-8 w-48 bg-gray-200 dark:bg-neutral-800 rounded-lg mb-3"></div>
                                        <div className="h-4 w-32 bg-gray-100 dark:bg-neutral-900 rounded-lg"></div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-800"></div>
                                </div>

                                {/* Bento Grid Mockup */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 bg-white dark:bg-neutral-900/50 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm h-64 relative overflow-hidden group">
                                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-lime-500/10 to-transparent"></div>
                                    </div>
                                    <div className="col-span-1 bg-white dark:bg-neutral-900/50 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm h-64"></div>
                                    <div className="col-span-1 bg-white dark:bg-neutral-900/50 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm h-48"></div>
                                    <div className="col-span-2 bg-white dark:bg-neutral-900/50 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm h-48"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
