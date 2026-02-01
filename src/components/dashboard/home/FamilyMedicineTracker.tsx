'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Sunrise, Sunset, Check, Circle, Loader2, Users, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/contexts/NotificationContext';

interface SharedMember {
    id: string;
    name: string;
    email?: string;
    relation: string;
    accessLevel: 'view' | 'edit' | 'full';
    status: 'pending' | 'active';
}

interface FamilyMedicine {
    id: string;
    name: string;
    dosage: string;
    timing: string;
    scheduledTime: string;
}

interface FamilyMemberSchedule {
    member: SharedMember;
    medicines: FamilyMedicine[];
    takenToday: Set<string>;
}

const FAMILY_STORAGE_KEY = 'meditrack_family_sharing';
const FAMILY_MEDS_KEY = 'meditrack_family_medicines';
const FAMILY_TAKEN_KEY = 'meditrack_family_taken';
const MISSED_ALERT_KEY = 'meditrack_missed_alerts_sent';

const getTimingIcon = (timing: string) => {
    switch (timing.toLowerCase()) {
        case 'morning':
            return { icon: Sunrise, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' };
        case 'afternoon':
            return { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' };
        case 'evening':
            return { icon: Sunset, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' };
        case 'night':
            return { icon: Moon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' };
        default:
            return { icon: Sun, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/10' };
    }
};

export function FamilyMedicineTracker() {
    const [familySchedules, setFamilySchedules] = useState<FamilyMemberSchedule[]>([]);
    const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isMarking, setIsMarking] = useState<string | null>(null);
    const { triggerMissedDoseAlert } = useNotifications();

    // Load family members and their schedules
    useEffect(() => {
        const loadFamilyData = () => {
            try {
                setLoading(true);
                
                // Load family members
                const savedMembers = localStorage.getItem(FAMILY_STORAGE_KEY);
                const members: SharedMember[] = savedMembers ? JSON.parse(savedMembers) : [];
                
                // Load medicines for each family member (don't generate dummy data)
                let savedMedicines = localStorage.getItem(FAMILY_MEDS_KEY);
                let familyMedicines: { [memberId: string]: FamilyMedicine[] } = savedMedicines ? JSON.parse(savedMedicines) : {};
                
                // Load taken status
                const today = new Date().toDateString();
                const savedTakenData = localStorage.getItem(FAMILY_TAKEN_KEY);
                let takenData: { date: string; taken: { [memberId: string]: string[] } } = savedTakenData 
                    ? JSON.parse(savedTakenData) 
                    : { date: today, taken: {} };
                
                // Reset taken data if it's a new day
                if (takenData.date !== today) {
                    takenData = { date: today, taken: {} };
                    localStorage.setItem(FAMILY_TAKEN_KEY, JSON.stringify(takenData));
                    // Also reset alert tracking for the new day
                    localStorage.setItem(MISSED_ALERT_KEY, JSON.stringify({ date: today, alerts: [] }));
                }
                
                // Only keep medicines for members that exist
                const validMemberIds = new Set(members.map(m => m.id));
                Object.keys(familyMedicines).forEach(memberId => {
                    if (!validMemberIds.has(memberId)) {
                        delete familyMedicines[memberId];
                    }
                });
                localStorage.setItem(FAMILY_MEDS_KEY, JSON.stringify(familyMedicines));
                
                // Create schedules
                const schedules: FamilyMemberSchedule[] = members.map(member => ({
                    member,
                    medicines: familyMedicines[member.id] || [],
                    takenToday: new Set(takenData.taken[member.id] || [])
                }));
                
                setFamilySchedules(schedules);
                
                // Check for missed doses
                checkMissedDoses(schedules);
                
            } catch (err) {
                console.error('Error loading family data:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadFamilyData();
        
        // Check for missed doses every minute
        const interval = setInterval(() => {
            const savedMembers = localStorage.getItem(FAMILY_STORAGE_KEY);
            const members: SharedMember[] = savedMembers ? JSON.parse(savedMembers) : [];
            const savedMedicines = localStorage.getItem(FAMILY_MEDS_KEY);
            const familyMedicines: { [memberId: string]: FamilyMedicine[] } = savedMedicines ? JSON.parse(savedMedicines) : {};
            const savedTakenData = localStorage.getItem(FAMILY_TAKEN_KEY);
            const takenData = savedTakenData ? JSON.parse(savedTakenData) : { date: new Date().toDateString(), taken: {} };
            
            const schedules: FamilyMemberSchedule[] = members.map(member => ({
                member,
                medicines: familyMedicines[member.id] || [],
                takenToday: new Set(takenData.taken[member.id] || [])
            }));
            
            checkMissedDoses(schedules);
        }, 60000); // Check every minute
        
        return () => clearInterval(interval);
    }, []);
    
    // Check for missed doses based on scheduled time
    const checkMissedDoses = useCallback((schedules: FamilyMemberSchedule[]) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const today = now.toDateString();
        
        // Load sent alerts
        const savedAlerts = localStorage.getItem(MISSED_ALERT_KEY);
        let alertData: { date: string; alerts: string[] } = savedAlerts 
            ? JSON.parse(savedAlerts) 
            : { date: today, alerts: [] };
        
        // Reset alerts if new day
        if (alertData.date !== today) {
            alertData = { date: today, alerts: [] };
        }
        
        const newAlerts: string[] = [];
        
        schedules.forEach(schedule => {
            schedule.medicines.forEach(med => {
                const [scheduledHour, scheduledMin] = med.scheduledTime.split(':').map(Number);
                const alertKey = `${schedule.member.id}-${med.id}`;
                
                // Check if this medicine is overdue (30 minutes past scheduled time) and not taken
                const scheduledTotalMinutes = scheduledHour * 60 + scheduledMin;
                const currentTotalMinutes = currentHour * 60 + currentMinutes;
                const graceMinutes = 30; // 30 minute grace period
                
                if (
                    currentTotalMinutes >= scheduledTotalMinutes + graceMinutes &&
                    !schedule.takenToday.has(med.id) &&
                    !alertData.alerts.includes(alertKey)
                ) {
                    // Trigger alert
                    triggerMissedDoseAlert(med.name, schedule.member.name);
                    newAlerts.push(alertKey);
                }
            });
        });
        
        // Save updated alerts
        if (newAlerts.length > 0) {
            alertData.alerts = [...alertData.alerts, ...newAlerts];
            localStorage.setItem(MISSED_ALERT_KEY, JSON.stringify(alertData));
        }
    }, [triggerMissedDoseAlert]);

    const toggleMemberExpand = (memberId: string) => {
        setExpandedMembers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const toggleMedicineTaken = async (memberId: string, medicineId: string, medicineName: string, memberName: string) => {
        setIsMarking(medicineId);
        
        try {
            // Load current taken data
            const today = new Date().toDateString();
            const savedTakenData = localStorage.getItem(FAMILY_TAKEN_KEY);
            let takenData: { date: string; taken: { [memberId: string]: string[] } } = savedTakenData 
                ? JSON.parse(savedTakenData) 
                : { date: today, taken: {} };
            
            // Reset if new day
            if (takenData.date !== today) {
                takenData = { date: today, taken: {} };
            }
            
            // Toggle taken status
            const memberTaken = takenData.taken[memberId] || [];
            const wasTaken = memberTaken.includes(medicineId);
            
            if (wasTaken) {
                takenData.taken[memberId] = memberTaken.filter(id => id !== medicineId);
            } else {
                takenData.taken[memberId] = [...memberTaken, medicineId];
            }
            
            // Save to localStorage
            localStorage.setItem(FAMILY_TAKEN_KEY, JSON.stringify(takenData));
            
            // Update state
            setFamilySchedules(prev => prev.map(schedule => {
                if (schedule.member.id === memberId) {
                    const newTaken = new Set(schedule.takenToday);
                    if (wasTaken) {
                        newTaken.delete(medicineId);
                    } else {
                        newTaken.add(medicineId);
                    }
                    return { ...schedule, takenToday: newTaken };
                }
                return schedule;
            }));
            
        } finally {
            setIsMarking(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={20} className="text-lime-500" />
                        Family Medicine Tracker
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-lime-500 mb-4" />
                    <p className="text-sm text-gray-500">Loading family schedules...</p>
                </div>
            </div>
        );
    }

    if (familySchedules.length === 0) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={20} className="text-lime-500" />
                        Family Medicine Tracker
                    </h2>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto mb-4 text-gray-300 dark:text-neutral-600" size={48} />
                    <p className="text-sm font-medium mb-1">No family members added</p>
                    <p className="text-xs">Add family members in Settings → Family Sharing</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-lime-500" />
                    Family Medicine Tracker
                </h2>
                <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                    {familySchedules.length} Member{familySchedules.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-4">
                {familySchedules.map(schedule => {
                    const isExpanded = expandedMembers.has(schedule.member.id);
                    const takenCount = schedule.takenToday.size;
                    const totalCount = schedule.medicines.length;
                    const missedCount = schedule.medicines.filter(med => {
                        const now = new Date();
                        const [hour, min] = med.scheduledTime.split(':').map(Number);
                        const scheduledMinutes = hour * 60 + min;
                        const currentMinutes = now.getHours() * 60 + now.getMinutes();
                        return currentMinutes > scheduledMinutes + 30 && !schedule.takenToday.has(med.id);
                    }).length;

                    return (
                        <div key={schedule.member.id} className="border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
                            {/* Member Header */}
                            <button
                                onClick={() => toggleMemberExpand(schedule.member.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-700 dark:text-lime-400 font-bold text-sm">
                                        {schedule.member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{schedule.member.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{schedule.member.relation}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {missedCount > 0 && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                                            <AlertTriangle size={12} />
                                            {missedCount} missed
                                        </span>
                                    )}
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        takenCount === totalCount 
                                            ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400'
                                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                                    }`}>
                                        {takenCount}/{totalCount}
                                    </span>
                                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                </div>
                            </button>

                            {/* Medicine List */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 space-y-2">
                                            {schedule.medicines.map(med => {
                                                const isTaken = schedule.takenToday.has(med.id);
                                                const { icon: TimingIcon, color, bg } = getTimingIcon(med.timing);
                                                const isCurrentlyMarking = isMarking === med.id;
                                                
                                                // Check if overdue
                                                const now = new Date();
                                                const [hour, min] = med.scheduledTime.split(':').map(Number);
                                                const scheduledMinutes = hour * 60 + min;
                                                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                                                const isOverdue = currentMinutes > scheduledMinutes + 30 && !isTaken;

                                                return (
                                                    <div
                                                        key={med.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                            isTaken
                                                                ? 'bg-lime-50 dark:bg-lime-900/10 border-lime-200 dark:border-lime-900/30'
                                                                : isOverdue
                                                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
                                                                    : 'bg-gray-50 dark:bg-neutral-800/50 border-gray-100 dark:border-neutral-700'
                                                        }`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}>
                                                            <TimingIcon size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium ${isTaken ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                                                                {med.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {med.dosage} • {med.scheduledTime}
                                                                {isOverdue && <span className="text-red-500 ml-2">• Overdue</span>}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleMedicineTaken(schedule.member.id, med.id, med.name, schedule.member.name)}
                                                            disabled={isCurrentlyMarking}
                                                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                                                isTaken
                                                                    ? 'bg-lime-500 text-white'
                                                                    : 'bg-white dark:bg-neutral-700 text-gray-400 hover:bg-lime-100 hover:text-lime-600 border border-gray-200 dark:border-neutral-600'
                                                            } ${isCurrentlyMarking ? 'opacity-50' : ''}`}
                                                        >
                                                            {isCurrentlyMarking ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : isTaken ? (
                                                                <Check size={14} strokeWidth={3} />
                                                            ) : (
                                                                <Circle size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
