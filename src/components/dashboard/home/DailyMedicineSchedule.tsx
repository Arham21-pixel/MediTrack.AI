'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Sunrise, Sunset, Check, Circle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, MedicineScheduleItem } from '@/lib/api-client';
import { useNotifications } from '@/contexts/NotificationContext';

interface DailyMedicineScheduleProps {
    onScheduleChange?: (takenCount: number, totalCount: number) => void;
}

const getTimingIcon = (timing: string) => {
    switch (timing.toLowerCase()) {
        case 'morning':
        case 'before_breakfast':
        case 'after_breakfast':
            return { icon: Sunrise, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' };
        case 'afternoon':
        case 'before_lunch':
        case 'after_lunch':
            return { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' };
        case 'evening':
        case 'before_dinner':
        case 'after_dinner':
            return { icon: Sunset, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' };
        case 'night':
            return { icon: Moon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' };
        default:
            return { icon: Sun, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/10' };
    }
};

const formatTime = (isoString: string) => {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return '';
    }
};

export function DailyMedicineSchedule({ onScheduleChange }: DailyMedicineScheduleProps) {
    const [scheduleItems, setScheduleItems] = useState<MedicineScheduleItem[]>([]);
    const [localTaken, setLocalTaken] = useState<Set<string>>(new Set());
    const [deletedMedicines, setDeletedMedicines] = useState<Set<string>>(new Set());
    const [isMarking, setIsMarking] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { scheduleMedicineReminders } = useNotifications();

    // Load medicines from prescriptions
    const loadScheduleFromPrescriptions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.getPrescriptions();
            const prescriptions = response.prescriptions || [];
            
            // Extract medicines from all prescriptions
            const medicines: MedicineScheduleItem[] = [];
            const today = new Date();
            
            prescriptions.forEach((prescription: any) => {
                const parsedData = prescription.parsed_data;
                if (parsedData?.medicines && Array.isArray(parsedData.medicines)) {
                    parsedData.medicines.forEach((med: any, index: number) => {
                        // Determine timing from frequency
                        const frequency = (med.frequency || '').toLowerCase();
                        let timings: string[] = ['morning'];
                        
                        if (frequency.includes('twice') || frequency.includes('2 times') || frequency.includes('bid')) {
                            timings = ['morning', 'evening'];
                        } else if (frequency.includes('three') || frequency.includes('3 times') || frequency.includes('tid')) {
                            timings = ['morning', 'afternoon', 'evening'];
                        } else if (frequency.includes('four') || frequency.includes('4 times') || frequency.includes('qid')) {
                            timings = ['morning', 'afternoon', 'evening', 'night'];
                        } else if (frequency.includes('night') || frequency.includes('bedtime')) {
                            timings = ['night'];
                        }
                        
                        timings.forEach((timing, timingIndex) => {
                            const scheduleTime = new Date(today);
                            let timeStr = '08:00';
                            if (timing === 'morning') { scheduleTime.setHours(8, 0, 0, 0); timeStr = '08:00'; }
                            else if (timing === 'afternoon') { scheduleTime.setHours(13, 0, 0, 0); timeStr = '13:00'; }
                            else if (timing === 'evening') { scheduleTime.setHours(19, 0, 0, 0); timeStr = '19:00'; }
                            else if (timing === 'night') { scheduleTime.setHours(22, 0, 0, 0); timeStr = '22:00'; }
                            
                            medicines.push({
                                medicine_id: `${prescription.id}-${index}-${timingIndex}`,
                                medicine_name: med.name || 'Unknown Medicine',
                                dosage: med.dosage || '',
                                scheduled_time: scheduleTime.toISOString(),
                                timing: timing,
                                status: undefined,
                                is_overdue: false,
                                _scheduledTimeStr: timeStr // Store for reminders
                            } as MedicineScheduleItem & { _scheduledTimeStr: string });
                        });
                    });
                }
            });
            
            // Sort by timing
            const timingOrder: { [key: string]: number } = { morning: 0, afternoon: 1, evening: 2, night: 3 };
            medicines.sort((a, b) => (timingOrder[a.timing] || 0) - (timingOrder[b.timing] || 0));
            
            const todayStr = today.toDateString();
            
            // Load deleted medicines from localStorage
            const savedDeleted = localStorage.getItem('meditrack_deleted_today');
            const savedDeletedDate = localStorage.getItem('meditrack_deleted_date');
            
            let deletedIds = new Set<string>();
            if (savedDeleted && savedDeletedDate === todayStr) {
                try {
                    deletedIds = new Set(JSON.parse(savedDeleted));
                } catch (e) {
                    // Invalid JSON, reset
                    localStorage.setItem('meditrack_deleted_today', '[]');
                }
            } else {
                // Reset for new day
                localStorage.setItem('meditrack_deleted_date', todayStr);
                localStorage.setItem('meditrack_deleted_today', '[]');
            }
            
            setDeletedMedicines(deletedIds);
            
            // Filter out deleted medicines
            const activeMedicines = medicines.filter(m => !deletedIds.has(m.medicine_id));
            
            setScheduleItems(activeMedicines);

            // Register medicines for reminders
            const reminderMedicines = activeMedicines.map(m => ({
                id: m.medicine_id,
                name: m.medicine_name,
                dosage: m.dosage,
                timing: m.timing,
                scheduledTime: (m as any)._scheduledTimeStr || '08:00'
            }));
            scheduleMedicineReminders(reminderMedicines);
            
            // Load taken state from localStorage
            const savedTaken = localStorage.getItem('meditrack_taken_today');
            const savedDate = localStorage.getItem('meditrack_taken_date');
            
            if (savedTaken && savedDate === todayStr) {
                try {
                    const takenIds = JSON.parse(savedTaken);
                    // Only include IDs that actually exist in current schedule (active medicines)
                    const validTakenIds = takenIds.filter((id: string) => 
                        activeMedicines.some(m => m.medicine_id === id)
                    );
                    setLocalTaken(new Set(validTakenIds));
                    
                    // Update localStorage with cleaned data
                    if (validTakenIds.length !== takenIds.length) {
                        localStorage.setItem('meditrack_taken_today', JSON.stringify(validTakenIds));
                    }
                } catch (e) {
                    // Invalid JSON, reset
                    localStorage.setItem('meditrack_taken_today', '[]');
                    setLocalTaken(new Set());
                }
            } else {
                // Reset for new day
                localStorage.setItem('meditrack_taken_date', todayStr);
                localStorage.setItem('meditrack_taken_today', '[]');
                setLocalTaken(new Set());
            }
        } catch (err) {
            console.error('Failed to load prescriptions:', err);
            setScheduleItems([]);
        } finally {
            setLoading(false);
        }
    }, [scheduleMedicineReminders]);

    useEffect(() => {
        loadScheduleFromPrescriptions();
    }, [loadScheduleFromPrescriptions]);

    // Notify parent of schedule changes - ensure it includes initial 0 state
    useEffect(() => {
        if (onScheduleChange && !loading) {
            onScheduleChange(localTaken.size, scheduleItems.length);
        }
    }, [localTaken.size, scheduleItems.length, onScheduleChange, loading]);

    const toggleTaken = async (medicineId: string) => {
        const wasTaken = localTaken.has(medicineId);

        // Update local state
        const newTaken = new Set(localTaken);
        if (wasTaken) {
            newTaken.delete(medicineId);
        } else {
            newTaken.add(medicineId);
        }
        setLocalTaken(newTaken);
        setIsMarking(medicineId);

        // Save to localStorage
        localStorage.setItem('meditrack_taken_today', JSON.stringify([...newTaken]));

        try {
            // Call API to mark medicine (optional - for persistence)
            if (!wasTaken) {
                await apiClient.markMedicineTaken(medicineId).catch(() => {});
            }
        } finally {
            setIsMarking(null);
        }
    };

    const deleteMedicine = (medicineId: string) => {
        // Remove from schedule
        setScheduleItems(prev => prev.filter(item => item.medicine_id !== medicineId));
        
        // Add to deleted set
        const newDeleted = new Set(deletedMedicines);
        newDeleted.add(medicineId);
        setDeletedMedicines(newDeleted);
        
        // Save to localStorage
        localStorage.setItem('meditrack_deleted_today', JSON.stringify([...newDeleted]));
        
        // Remove from taken set if it was marked
        if (localTaken.has(medicineId)) {
            const newTaken = new Set(localTaken);
            newTaken.delete(medicineId);
            setLocalTaken(newTaken);
            localStorage.setItem('meditrack_taken_today', JSON.stringify([...newTaken]));
        }
    };

    const takenCount = localTaken.size;
    const totalCount = scheduleItems.length;

    if (loading) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors h-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Schedule</h2>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-lime-500 mb-4" />
                    <p className="text-sm text-gray-500">Loading your schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Schedule</h2>
                <span className="text-xs font-medium bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-2 py-1 rounded-full">
                    {takenCount}/{totalCount} Taken
                </span>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {scheduleItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No medicines scheduled for today</p>
                            <p className="text-xs mt-1">Upload a prescription to get started</p>
                        </div>
                    ) : (
                        scheduleItems.slice(0, 15).map((item) => {
                            const isTaken = localTaken.has(item.medicine_id);
                            const isCurrentlyMarking = isMarking === item.medicine_id;
                            const { icon: TimingIcon, color, bg } = getTimingIcon(item.timing);
                            const timeStr = formatTime(item.scheduled_time);

                            return (
                                <motion.div
                                    layout
                                    key={item.medicine_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${isTaken
                                        ? 'bg-lime-50 dark:bg-lime-900/10 border-lime-200 dark:border-lime-900/30'
                                        : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-lime-200 dark:hover:border-neutral-700'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
                                        <TimingIcon size={18} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-sm ${isTaken
                                            ? 'text-gray-500 dark:text-gray-400 line-through'
                                            : 'text-gray-900 dark:text-gray-100'
                                            }`}>
                                            {item.medicine_name}
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                            {item.dosage || 'As prescribed'}{timeStr ? ` • ${timeStr}` : ''}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleTaken(item.medicine_id)}
                                        disabled={isCurrentlyMarking}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${isTaken
                                            ? 'bg-lime-500 text-white shadow-lg shadow-lime-200 dark:shadow-none'
                                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:bg-lime-100 hover:text-lime-600'
                                            } ${isCurrentlyMarking ? 'opacity-50' : ''}`}
                                    >
                                        {isCurrentlyMarking ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : isTaken ? (
                                            <Check size={16} strokeWidth={3} />
                                        ) : (
                                            <Circle size={16} />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => deleteMedicine(item.medicine_id)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                        title="Delete medicine"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="mt-6">
                    <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-lime-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(takenCount / totalCount) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        {takenCount === totalCount
                            ? '🎉 All medicines taken for today!'
                            : `${totalCount - takenCount} remaining`
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
