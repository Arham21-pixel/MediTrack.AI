'use client';

import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function FloatingActionButton() {
    return (
        <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-16 h-16 bg-gray-900 text-lime-400 rounded-full shadow-2xl shadow-gray-900/40 flex items-center justify-center z-50 hover:bg-black transition-colors"
            title="Upload Prescription"
        >
            <Plus size={32} strokeWidth={3} />
        </motion.button>
    );
}
