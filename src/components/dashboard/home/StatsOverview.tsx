'use client';

import { useEffect, useState } from 'react';
import { Pill, ClipboardList, Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient, useMedicines } from '@/lib/api-client';

interface StatItem {
    label: string;
    value: string;
    icon: React.ComponentType<{ size?: number }>;
    color: string;
    bg: string;
    loading?: boolean;
}

interface StatsOverviewProps {
    takenCount?: number;
    totalCount?: number;
}

export function StatsOverview({ takenCount = 0, totalCount = 0 }: StatsOverviewProps) {
    const { medicines, loading: medicinesLoading } = useMedicines();
    const [prescriptionCount, setPrescriptionCount] = useState<number | null>(null);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);

    // Fetch prescription count
    useEffect(() => {
        async function fetchPrescriptions() {
            try {
                const response = await apiClient.getPrescriptions();
                setPrescriptionCount(response.prescriptions?.length || response.total || 0);
            } catch (err) {
                // On error, show 0 - only display real data
                console.log('Prescription fetch failed, showing 0');
                setPrescriptionCount(0);
            } finally {
                setLoadingPrescriptions(false);
            }
        }
        fetchPrescriptions();
    }, []);

    // Calculate stats from real data
    const activeMedicines = medicines.filter(m => m.is_active).length;
    
    // Calculate adherence from taken/total count
    const adherencePercentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

    const stats: StatItem[] = [
        {
            label: 'Total Scripts',
            value: loadingPrescriptions ? '-' : String(prescriptionCount || 0),
            icon: ClipboardList,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            loading: loadingPrescriptions
        },
        {
            label: 'Active Meds',
            value: medicinesLoading ? '-' : String(activeMedicines || totalCount),
            icon: Pill,
            color: 'text-lime-600 dark:text-lime-400',
            bg: 'bg-lime-50 dark:bg-lime-900/10',
            loading: medicinesLoading
        },
        {
            label: 'Adherence',
            value: `${adherencePercentage}%`,
            icon: Activity,
            color: adherencePercentage >= 80 ? 'text-green-500' : adherencePercentage >= 50 ? 'text-yellow-500' : 'text-red-500',
            bg: adherencePercentage >= 80 ? 'bg-green-50 dark:bg-green-900/10' : adherencePercentage >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-red-50 dark:bg-red-900/10',
            loading: false
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4 transition-colors"
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        {stat.loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <stat.icon size={20} />
                        )}
                    </div>
                    <div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {stat.value}
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
