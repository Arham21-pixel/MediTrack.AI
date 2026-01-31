'use client';

import { motion } from 'framer-motion';
import { Upload, ScanLine, MessageSquareText, BellRing } from 'lucide-react';

const steps = [
    {
        icon: Upload,
        title: 'Upload',
        description: 'Snap a photo of your prescription or lab report.',
    },
    {
        icon: ScanLine,
        title: 'AI Reads',
        description: 'Our advanced AI extracts every detail instantly.',
    },
    {
        icon: MessageSquareText,
        title: 'AI Explains',
        description: 'Get a simple summary of what it means for you.',
    },
    {
        icon: BellRing,
        title: 'Reminds',
        description: 'Automatically sets up your medicine schedule.',
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
            {/* Connecting line background - visible on desktop */}
            <div className="hidden md:block absolute top-[45%] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-lime-200 to-transparent w-full -z-10" />

            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <span className="text-lime-600 font-semibold tracking-wide uppercase text-sm">Simple Process</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                        From Photo to Peace of Mind
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                            className="relative flex flex-col items-center text-center group"
                        >
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border-2 border-lime-100 flex items-center justify-center mb-6 z-10 group-hover:border-lime-400 group-hover:scale-110 transition-all duration-300">
                                <step.icon size={32} className="text-lime-600" />
                            </div>

                            <div className="absolute top-10 -right-1/2 w-full h-0.5 bg-lime-100 hidden md:block last:hidden -z-0" />

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                            <p className="text-gray-500 text-sm max-w-[200px]">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
