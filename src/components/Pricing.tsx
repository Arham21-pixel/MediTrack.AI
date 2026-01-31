'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'Free',
        price: '$0',
        frequency: '/month',
        description: 'Perfect for individuals managing simple prescriptions.',
        features: ['5 Prescriptions / month', 'Basic Medicine Reminders', 'Standard Support'],
        cta: 'Get Started',
        popular: false,
    },
    {
        name: 'Premium',
        price: '$9',
        frequency: '/month',
        description: 'Advanced AI features for complete health management.',
        features: ['Unlimited Prescriptions', 'AI Lab Report Explainer', 'Smart Drug Interaction Checks', 'Priority Support', 'Health Timeline'],
        cta: 'Try Free for 14 Days',
        popular: true,
    },
    {
        name: 'Family',
        price: '$19',
        frequency: '/month',
        description: 'Care for your parents and children in one place.',
        features: ['Up to 5 Family Members', 'Caregiver Alerts', 'Shared Dashboard', 'All Premium Features'],
        cta: 'Contact Sales',
        popular: false,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-gray-50/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-gray-600">
                        Start for free, upgrade when you need more power.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`relative bg-white rounded-3xl p-8 border ${plan.popular
                                ? 'border-lime-400 shadow-xl shadow-lime-200/50 scale-105 z-10'
                                : 'border-gray-100 shadow-sm hover:shadow-md'
                                } flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline text-gray-900">
                                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                                    <span className="ml-1 text-xl font-semibold text-gray-500">{plan.frequency}</span>
                                </div>
                                <p className="mt-4 text-gray-500">{plan.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="flex-shrink-0 w-5 h-5 text-lime-500" />
                                        <span className="text-gray-600 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/dashboard" className="w-full">
                                <Button
                                    variant={plan.popular ? 'primary' : 'outline'}
                                    className="w-full"
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
