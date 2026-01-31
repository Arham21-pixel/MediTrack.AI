'use client';

import { motion } from 'framer-motion';
import { ScanText, Clock, FileSearch, CalendarRange, Bell, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: ScanText,
        title: 'AI Prescription Reader',
        description: 'Deciphers messy handwriting and converts it into a digital list of medicines.',
        className: 'md:col-span-2 bg-lime-50 border-lime-100',
        iconColor: 'bg-lime-500 text-white',
    },
    {
        icon: Clock,
        title: 'Medicine Reminders',
        description: 'Timely notifications so you never forget a dose.',
        className: 'bg-white border-gray-100',
        iconColor: 'bg-orange-100 text-orange-600',
    },
    {
        icon: FileSearch,
        title: 'Health Report Explainer',
        description: 'Understand your blood work and lab results in plain English.',
        className: 'bg-white border-gray-100',
        iconColor: 'bg-blue-100 text-blue-600',
    },
    {
        icon: CalendarRange,
        title: 'Health Timeline',
        description: 'Track your medication history and adherence over time.',
        className: 'bg-white border-gray-100',
        iconColor: 'bg-purple-100 text-purple-600',
    },
    {
        icon: Bell,
        title: 'Smart Alerts',
        description: 'Get notified about refills and conflicting medications.',
        className: 'md:col-span-2 bg-gray-900 text-white border-gray-800',
        iconColor: 'bg-gray-800 text-lime-400',
        dark: true,
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-gray-50 dark:bg-black transition-colors duration-500">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Everything You Need to <br />
                        <span className="text-lime-600 dark:text-lime-500">Take Control.</span>
                    </h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        Powerful tools designed to simplify your healthcare journey.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-fr">
                    {/* Feature 1: Large Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="md:col-span-2 md:row-span-2 bg-white dark:bg-neutral-900 rounded-[2rem] p-8 border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-100/50 dark:bg-lime-900/20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-lime-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-lime-500/30">
                                    <ScanText size={32} />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">AI Prescription Reader</h3>
                                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Simply snap a photo of your doctor's handwritten notes. Our advanced AI instantly checks for drug interactions, dosage instructions, and converts it into a digital schedule.
                                </p>
                            </div>
                            <div className="mt-8">
                                <span className="inline-flex items-center gap-2 text-sm font-bold text-lime-600 dark:text-lime-400 group-hover:gap-3 transition-all cursor-pointer">
                                    Try it out <ShieldCheck size={16} />
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="md:col-span-1 bg-white dark:bg-neutral-900 rounded-[2rem] p-8 border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                    >
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Reminders</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Never miss a dose with intelligent, adaptive notifications.</p>
                        </div>
                    </motion.div>

                    {/* Feature 3 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="md:col-span-1 bg-white dark:bg-neutral-900 rounded-[2rem] p-8 border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                            <FileSearch size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Report Analysis</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Understand your lab results in plain, simple English.</p>
                        </div>
                    </motion.div>

                    {/* Feature 4 - Dark Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="md:col-span-2 bg-[#111] dark:bg-neutral-950 rounded-[2rem] p-8 border border-gray-800 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden flex items-center"
                    >
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-lime-900/20 to-transparent"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-400 shrink-0">
                                <Bell size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Stay Connected</h3>
                                <p className="text-gray-400">
                                    Get alerts for refills, track family members' health, and ensure complete peace of mind.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
