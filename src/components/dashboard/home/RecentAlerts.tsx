'use client';

import { Activity, AlertTriangle, Calendar, Bell, Users, Clock, X } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const getAlertStyle = (type: Notification['type']) => {
    switch (type) {
        case 'missed_dose':
            return {
                bg: 'bg-amber-50 dark:bg-amber-900/10',
                border: 'border-amber-100 dark:border-amber-900/30',
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                icon: AlertTriangle
            };
        case 'family_alert':
            return {
                bg: 'bg-red-50 dark:bg-red-900/10',
                border: 'border-red-100 dark:border-red-900/30',
                iconBg: 'bg-red-100 dark:bg-red-900/30',
                iconColor: 'text-red-600 dark:text-red-400',
                icon: Users
            };
        case 'reminder':
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/10',
                border: 'border-blue-100 dark:border-blue-900/30',
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                icon: Clock
            };
        default:
            return {
                bg: 'bg-gray-50 dark:bg-gray-900/10',
                border: 'border-gray-100 dark:border-gray-900/30',
                iconBg: 'bg-gray-100 dark:bg-gray-900/30',
                iconColor: 'text-gray-600 dark:text-gray-400',
                icon: Bell
            };
    }
};

const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

export function RecentAlerts() {
    const { notifications, clearNotification, markAsRead } = useNotifications();
    
    // Get recent alerts (last 5, prioritize unread and family alerts)
    const recentAlerts = [...notifications]
        .sort((a, b) => {
            // Prioritize unread
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            // Then by type (family_alert first)
            if (a.type === 'family_alert' && b.type !== 'family_alert') return -1;
            if (a.type !== 'family_alert' && b.type === 'family_alert') return 1;
            // Then by date
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Alerts</h2>
                {notifications.filter(n => !n.read).length > 0 && (
                    <span className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                        {notifications.filter(n => !n.read).length} new
                    </span>
                )}
            </div>
            
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {recentAlerts.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-gray-500"
                        >
                            <Bell className="mx-auto mb-3 text-gray-300 dark:text-neutral-600" size={36} />
                            <p className="text-sm font-medium">No alerts yet</p>
                            <p className="text-xs mt-1">You'll see medication alerts here</p>
                        </motion.div>
                    ) : (
                        recentAlerts.map((alert) => {
                            const style = getAlertStyle(alert.type);
                            const Icon = style.icon;
                            
                            return (
                                <motion.div
                                    key={alert.id}
                                    layout
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`relative flex gap-3 p-3 rounded-xl ${style.bg} border ${style.border} ${!alert.read ? 'ring-2 ring-lime-200 dark:ring-lime-800' : ''}`}
                                    onClick={() => markAsRead(alert.id)}
                                >
                                    <div className={`w-9 h-9 rounded-full ${style.iconBg} ${style.iconColor} flex items-center justify-center shrink-0`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                                                {alert.title}
                                            </h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(alert.id);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                            {alert.message}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {getTimeAgo(alert.createdAt)}
                                        </p>
                                    </div>
                                    {!alert.read && (
                                        <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-lime-500"></div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

