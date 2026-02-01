'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-lime-500 rounded-3xl p-12 md:p-24 text-center relative overflow-hidden"
                >
                    {/* Decorative circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold text-lime-950 mb-6">
                            Ready to Understand Your Health?
                        </h2>
                        <p className="text-lime-900/80 text-xl mb-10 max-w-2xl mx-auto">
                            Join thousands of users who are taking control of their medication and health reports today.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/dashboard" className="w-full sm:w-auto">
                                <Button size="lg" className="bg-white text-lime-900 hover:bg-lime-50 w-full">
                                    Start Free – Upload Prescription
                                </Button>
                            </Link>
                            <Link href="/dashboard" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="border-lime-800 text-lime-900 hover:bg-lime-600/10 w-full sm:w-auto">
                                    Schedule Demo
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
