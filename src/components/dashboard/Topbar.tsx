'use client';

import { Bell, Search, User, LogOut, X, Check, AlertTriangle, Users, Clock, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

function NotificationDropdown({ 
    notifications, 
    onMarkAsRead, 
    onMarkAllAsRead, 
    onClear,
    onClose 
}: {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClear: (id: string) => void;
    onClose: () => void;
}) {
    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'missed_dose':
                return <AlertTriangle className="text-amber-500" size={16} />;
            case 'family_alert':
                return <Users className="text-red-500" size={16} />;
            case 'reminder':
                return <Clock className="text-blue-500" size={16} />;
            default:
                return <Bell className="text-gray-500" size={16} />;
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

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-700 overflow-hidden z-50"
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-xs text-lime-600 dark:text-lime-400 hover:underline"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="mx-auto mb-2 opacity-50" size={32} />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    notifications.slice(0, 10).map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-50 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-lime-50/50 dark:bg-lime-900/10' : ''
                            }`}
                            onClick={() => onMarkAsRead(notification.id)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {notification.title}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClear(notification.id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {getTimeAgo(notification.createdAt)}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-lime-500 flex-shrink-0 mt-2"></div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 dark:border-neutral-800">
                    <button
                        onClick={onClose}
                        className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export function Topbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle theme mounting
        // Search functionality
        const handleSearch = useCallback(async (query: string) => {
            setSearchQuery(query);
        
            if (!query.trim()) {
                setSearchResults([]);
                setShowSearchResults(false);
                return;
            }
        
            setIsSearching(true);
            setShowSearchResults(true);
        
            try {
                // Search in localStorage for prescriptions and medicines
                const prescriptionsData = localStorage.getItem('meditrack_prescriptions');
                const results: any[] = [];
            
                if (prescriptionsData) {
                    const prescriptions = JSON.parse(prescriptionsData);
                    const lowerQuery = query.toLowerCase();
                
                    prescriptions.forEach((prescription: any) => {
                        // Search prescription name
                        if (prescription.name?.toLowerCase().includes(lowerQuery)) {
                            results.push({
                                type: 'prescription',
                                id: prescription.id,
                                title: prescription.name || 'Prescription',
                                subtitle: new Date(prescription.created_at).toLocaleDateString(),
                                path: '/dashboard/prescriptions'
                            });
                        }
                    
                        // Search medicines in prescription
                        if (prescription.parsed_data?.medicines) {
                            prescription.parsed_data.medicines.forEach((med: any) => {
                                if (med.name?.toLowerCase().includes(lowerQuery)) {
                                    results.push({
                                        type: 'medicine',
                                        id: `${prescription.id}-${med.name}`,
                                        title: med.name,
                                        subtitle: `${med.dosage || ''} - ${prescription.name || 'Prescription'}`,
                                        path: '/dashboard/prescriptions'
                                    });
                                }
                            });
                        }
                    });
                }
            
                // Search reports
                const reportsData = localStorage.getItem('meditrack_reports');
                if (reportsData) {
                    const reports = JSON.parse(reportsData);
                    const lowerQuery = query.toLowerCase();
                
                    reports.forEach((report: any) => {
                        if (report.name?.toLowerCase().includes(lowerQuery) || 
                            report.report_type?.toLowerCase().includes(lowerQuery)) {
                            results.push({
                                type: 'report',
                                id: report.id,
                                title: report.name || report.report_type || 'Health Report',
                                subtitle: new Date(report.created_at).toLocaleDateString(),
                                path: '/dashboard/reports'
                            });
                        }
                    });
                }
            
                setSearchResults(results.slice(0, 10)); // Limit to 10 results
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, []);
    
        const handleResultClick = (path: string) => {
            setShowSearchResults(false);
            setSearchQuery('');
            router.push(path);
        };
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Get initials from name or email
    const getInitials = () => {
        if (user?.name) {
            const parts = user.name.split(' ');
            return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return 'U';
    };

    const displayName = user?.name || user?.email?.split('@')[0] || 'Guest';

    return (
        <header className="h-16 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-md hidden md:block">
                    <div ref={searchRef} className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchQuery && setShowSearchResults(true)}
                            placeholder="Search prescriptions, medicines, or reports..."
                            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 focus:bg-white dark:focus:bg-neutral-900 transition-all text-sm outline-none placeholder:text-gray-400 dark:text-gray-100"
                        />
                        
                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showSearchResults && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-12 left-0 right-0 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-700 overflow-hidden z-50 max-h-96 overflow-y-auto"
                                >
                                    {isSearching ? (
                                        <div className="p-8 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500 mx-auto"></div>
                                            <p className="text-sm text-gray-500 mt-4">Searching...</p>
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <Search className="mx-auto mb-2 opacity-50" size={32} />
                                            <p className="text-sm">No results found for "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        <div className="py-2">
                                            {searchResults.map((result) => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => handleResultClick(result.path)}
                                                    className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left flex items-start gap-3"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        result.type === 'prescription' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                        result.type === 'medicine' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                                        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                    }`}>
                                                        {result.type === 'prescription' ? '📋' : result.type === 'medicine' ? '💊' : '📊'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {result.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {result.subtitle}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <span className="md:hidden font-bold text-lg text-gray-900 dark:text-white">Dashboard</span>
            </div>

            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        aria-label="Toggle dark mode"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                )}

                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-neutral-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <NotificationDropdown
                                notifications={notifications}
                                onMarkAsRead={markAsRead}
                                onMarkAllAsRead={markAllAsRead}
                                onClear={clearNotification}
                                onClose={() => setShowNotifications(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-8 w-px bg-gray-200 dark:bg-neutral-800 mx-2 hidden md:block"></div>

                <button 
                    onClick={() => router.push('/dashboard/settings')}
                    className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <div className="hidden md:block text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{displayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {isAuthenticated ? 'Premium Plan' : 'Demo Mode'}
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-800 text-sm font-bold">
                        {getInitials()}
                    </div>
                </button>

                {isAuthenticated && (
                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </header>
    );
}
