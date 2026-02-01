'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    type: 'missed_dose' | 'family_alert' | 'reminder' | 'system';
    title: string;
    message: string;
    familyMemberName?: string;
    medicineName?: string;
    time: string;
    read: boolean;
    createdAt: string;
}

interface ScheduledMedicine {
    id: string;
    name: string;
    dosage: string;
    timing: string;
    scheduledTime: string; // HH:MM format
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
    triggerMissedDoseAlert: (medicineName: string, familyMemberName?: string) => void;
    triggerMedicineReminder: (medicineName: string, dosage: string, scheduledTime: string) => void;
    scheduleMedicineReminders: (medicines: ScheduledMedicine[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_KEY = 'meditrack_notifications';
const REMINDERS_SENT_KEY = 'meditrack_reminders_sent';
const REMINDER_MINUTES_BEFORE = 15; // Send reminder 15 minutes before scheduled time

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user, isAuthenticated } = useAuth();
    const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const scheduledMedicinesRef = useRef<ScheduledMedicine[]>([]);

    // Load notifications from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(NOTIFICATIONS_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotifications(parsed);
            } catch (e) {
                console.error('Failed to load notifications');
            }
        }
    }, []);

    // Save notifications to localStorage
    useEffect(() => {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }, [notifications]);

    // Send email for reminders
    const sendReminderEmail = async (medicineName: string, dosage: string, scheduledTime: string, email: string) => {
        try {
            const token = localStorage.getItem('meditrack_token');
            await fetch(`http://localhost:8000/api/notifications/email/reminder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    email: email,
                    medicine_name: medicineName,
                    dosage: dosage,
                    scheduled_time: scheduledTime
                })
            });
            console.log('Reminder email sent successfully');
        } catch (error) {
            console.error('Failed to send reminder email:', error);
        }
    };

    const sendEmailAlert = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>, email: string) => {
        try {
            const token = localStorage.getItem('meditrack_token');
            
            // Use the family missed dose endpoint for family alerts
            if (notification.type === 'family_alert' && notification.familyMemberName) {
                await fetch(`http://localhost:8000/api/notifications/family/missed-dose`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify({
                        email: email,
                        family_member_name: notification.familyMemberName,
                        medicine_name: notification.medicineName || 'medication',
                        missed_time: notification.time
                    })
                });
            } else if (notification.type === 'missed_dose') {
                // Use the standard missed dose endpoint for user's own medications
                await fetch(`http://localhost:8000/api/notifications/email/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify({
                        email: email,
                        notification_type: 'missed_dose',
                        medicine_name: notification.medicineName || 'medication',
                        time: notification.time
                    })
                });
            }
            console.log('Email alert sent successfully');
        } catch (error) {
            console.error('Failed to send email alert:', error);
        }
    };

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            createdAt: new Date().toISOString(),
            read: false,
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        
        // Send email alert for missed doses and family alerts
        if ((notification.type === 'missed_dose' || notification.type === 'family_alert') && user?.email) {
            sendEmailAlert(notification, user.email);
        }
    }, [user?.email]);

    // Trigger a medicine reminder notification
    const triggerMedicineReminder = useCallback((medicineName: string, dosage: string, scheduledTime: string) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        addNotification({
            type: 'reminder',
            title: '💊 Medicine Reminder',
            message: `Time to take ${medicineName} ${dosage}. Scheduled for ${scheduledTime}.`,
            medicineName,
            time: timeStr
        });

        // Send email reminder
        if (user?.email) {
            sendReminderEmail(medicineName, dosage, scheduledTime, user.email);
        }
    }, [addNotification, user?.email]);

    // Schedule medicine reminders
    const scheduleMedicineReminders = useCallback((medicines: ScheduledMedicine[]) => {
        scheduledMedicinesRef.current = medicines;
    }, []);

    // Check for upcoming medicine reminders
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const today = now.toDateString();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTotalMinutes = currentHour * 60 + currentMinutes;

            // Load sent reminders for today
            const savedReminders = localStorage.getItem(REMINDERS_SENT_KEY);
            let reminderData: { date: string; sent: string[] } = savedReminders 
                ? JSON.parse(savedReminders) 
                : { date: today, sent: [] };

            // Reset if new day
            if (reminderData.date !== today) {
                reminderData = { date: today, sent: [] };
            }

            const newRemindersSent: string[] = [];

            scheduledMedicinesRef.current.forEach(medicine => {
                const [schedHour, schedMin] = medicine.scheduledTime.split(':').map(Number);
                const scheduledTotalMinutes = schedHour * 60 + schedMin;
                const reminderKey = `${medicine.id}-${medicine.scheduledTime}`;

                // Check if it's time to send reminder (15 minutes before)
                const reminderTime = scheduledTotalMinutes - REMINDER_MINUTES_BEFORE;
                
                if (
                    currentTotalMinutes >= reminderTime &&
                    currentTotalMinutes < scheduledTotalMinutes &&
                    !reminderData.sent.includes(reminderKey)
                ) {
                    // Trigger reminder
                    triggerMedicineReminder(medicine.name, medicine.dosage, medicine.scheduledTime);
                    newRemindersSent.push(reminderKey);
                }
            });

            // Save updated reminders
            if (newRemindersSent.length > 0) {
                reminderData.sent = [...reminderData.sent, ...newRemindersSent];
                localStorage.setItem(REMINDERS_SENT_KEY, JSON.stringify(reminderData));
            }
        };

        // Check immediately
        checkReminders();

        // Then check every minute
        reminderIntervalRef.current = setInterval(checkReminders, 60000);

        return () => {
            if (reminderIntervalRef.current) {
                clearInterval(reminderIntervalRef.current);
            }
        };
    }, [triggerMedicineReminder]);

    const triggerMissedDoseAlert = useCallback((medicineName: string, familyMemberName?: string) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        if (familyMemberName) {
            addNotification({
                type: 'family_alert',
                title: `${familyMemberName} Missed Medication`,
                message: `${familyMemberName} hasn't taken their ${medicineName}. Please check on them.`,
                familyMemberName,
                medicineName,
                time: timeStr
            });
        } else {
            addNotification({
                type: 'missed_dose',
                title: 'Missed Medication',
                message: `You missed taking ${medicineName}. Please take it as soon as possible.`,
                medicineName,
                time: timeStr
            });
        }
    }, [addNotification]);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    }, []);

    const clearNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotification,
            clearAll,
            triggerMissedDoseAlert,
            triggerMedicineReminder,
            scheduleMedicineReminders,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
