'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Why AI', href: '#why-ai' },
        { name: 'Pricing', href: '#pricing' },
    ];

    return (
        <nav
            className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 flex justify-center`}
        >
            <div className={`
                container mx-4 md:mx-auto max-w-5xl rounded-full px-6 py-3 flex items-center justify-between
                bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl shadow-black/5
                ${isScrolled ? 'w-full md:w-[90%] scale-100' : 'w-full md:w-[95%] scale-[1.01]'}
            `}>
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
                    <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-lime-950 shadow-[0_0_15px_rgba(163,230,53,0.5)]">
                        <Activity size={18} />
                    </div>
                    <span className="tracking-tight">MediTrack<span className="text-lime-500">.ai</span></span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1 bg-gray-100/50 dark:bg-neutral-900/50 p-1 rounded-full border border-gray-200/50 dark:border-white/5">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-full transition-all duration-300"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                        Log in
                    </Link>
                    <Link href="/signup">
                        <Button size="sm" className="rounded-full bg-lime-400 hover:bg-lime-500 text-black font-semibold shadow-[0_0_20px_rgba(163,230,53,0.4)] border-none">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-gray-900 dark:text-white p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-base font-medium text-gray-600 py-2 border-b border-gray-50 last:border-0"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 mt-4">
                                <Link href="/login" className="w-full">
                                    <Button variant="secondary" className="w-full justify-center">Log in</Button>
                                </Link>
                                <Link href="/signup" className="w-full">
                                    <Button className="w-full justify-center">Get Started</Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
