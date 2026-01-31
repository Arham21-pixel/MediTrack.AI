'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

export function WhyAI() {
    return (
        <section id="why-ai" className="py-24 bg-gray-900 text-white overflow-hidden relative">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-lime-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            Why Trust <span className="text-lime-400">AI</span> with Your Health?
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Traditional healthcare data is messy. Handwritten prescriptions, varying lab report formats, and complex medical jargon make it hard for humans to stay on top of things. Our AI cuts through the chaos.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {[
                                '99.9% accuracy in reading handwriting',
                                'Instantly standardizes different lab formats',
                                'Catches drug interactions doctors might miss',
                                'Available 24/7 to explain your reports'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center flex-shrink-0">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-gray-300 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <Button className="bg-lime-500 text-gray-900 hover:bg-lime-400 border-none">
                            Learn More About Our Tech
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-800/50 backdrop-blur-sm p-8">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <div className="text-9xl font-mono text-lime-500 font-bold">AI</div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs text-gray-500 font-mono">INPUT</span>
                                    </div>
                                    <div className="font-handwriting text-gray-400 italic font-serif text-lg opacity-70">
                                        &quot;Rx: Amoxicillin 500mg, take 1 tab tid for 7 days...&quot;
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <div className="bg-lime-500/20 text-lime-400 p-2 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                                    </div>
                                </div>

                                <div className="bg-lime-500/10 p-4 rounded-xl border border-lime-500/30">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs text-lime-400 font-mono">OUTPUT</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300">Medicine:</span>
                                            <span className="font-bold text-white">Amoxicillin</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300">Dosage:</span>
                                            <span className="font-bold text-white">500mg</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300">Frequency:</span>
                                            <span className="font-bold text-white">3x Daily</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300">Duration:</span>
                                            <span className="font-bold text-white">7 Days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
