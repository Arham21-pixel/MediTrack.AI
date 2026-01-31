'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        content: "I used to forget my medicines all the time. Since using MediTrack, I haven't missed a single dose. It's a lifesaver.",
        author: "Martha S.",
        role: "Retired Teacher",
        rating: 5
    },
    {
        content: "The prescription reader is magic. I just snap a photo and it knows exactly what the doctor wrote. No more guessing.",
        author: "David L.",
        role: "Caregiver",
        rating: 5
    },
    {
        content: "My dad's lab reports were always confusing. This app explains them in simple terms so we actually understand his health.",
        author: "Sarah J.",
        role: "Family User",
        rating: 5
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                        Loved by Thousands
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-gray-50 p-8 rounded-3xl border border-gray-100"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(item.rating)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-800 text-lg mb-6 italic">&quot;{item.content}&quot;</p>
                            <div>
                                <div className="font-bold text-gray-900">{item.author}</div>
                                <div className="text-sm text-gray-500">{item.role}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
