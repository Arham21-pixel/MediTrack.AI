'use client';

import { motion } from 'framer-motion';
import { FileQuestion, AlertCircle, FileX } from 'lucide-react';

const problems = [
    {
        icon: FileQuestion,
        title: 'Confusing Prescriptions',
        description: 'Handwritten notes that are impossible to read, leading to dosage errors and confusion.',
        color: 'bg-red-50 text-red-600',
    },
    {
        icon: AlertCircle,
        title: 'Missed Medicines',
        description: 'Forgetting to take pills on time or mixing up conflicting medications.',
        color: 'bg-orange-50 text-orange-600',
    },
    {
        icon: FileX,
        title: 'Unclear Lab Reports',
        description: 'Complex medical jargon and numbers that leave you anxious and uninformed.',
        color: 'bg-blue-50 text-blue-600',
    },
];

export function Problem() {
    return (
        <section className="py-24 bg-gray-50/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Managing Health Shouldn&apos;t Be Hard
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Millions struggle with understanding their medical documents and sticking to their treatment plans.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {problems.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${item.color}`}>
                                <item.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{item.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
