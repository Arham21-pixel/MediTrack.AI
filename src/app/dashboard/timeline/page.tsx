'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, FileText, Share2, MoreVertical, Eye, File, Loader2, RefreshCcw, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline, TimelineItem, apiClient } from '@/lib/api-client';

export default function TimelinePage() {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { timeline, loading, error, refetch } = useTimeline(100);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    
    // Modal states
    const [viewItem, setViewItem] = useState<TimelineItem | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<TimelineItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

    // Filter timeline items based on selected filter, search, and date range
    const filteredTimeline = useMemo(() => timeline.filter(item => {
        // Filter out locally deleted items
        if (deletedIds.has(item.id)) return false;

        // Filter by date range
        if (dateRange.start || dateRange.end) {
            const itemDate = new Date(item.date);
            if (dateRange.start && itemDate < new Date(dateRange.start)) return false;
            if (dateRange.end && itemDate > new Date(dateRange.end + 'T23:59:59')) return false;
        }

        // Filter by type
        if (filter !== 'all') {
            if (filter === 'prescriptions' && item.type !== 'prescription') return false;
            if (filter === 'reports' && item.type !== 'report') return false;
        }
        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return item.title.toLowerCase().includes(query) || 
                   (item.description?.toLowerCase().includes(query)) ||
                   (item.metadata?.doctor_name?.toLowerCase().includes(query));
        }
        return true;
    }), [timeline, deletedIds, filter, searchQuery, dateRange]);

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Get status color
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'critical':
            case 'abnormal':
                return 'text-red-500';
            case 'warning':
                return 'text-yellow-500';
            case 'normal':
                return 'text-green-500';
            case 'active':
                return 'text-blue-500';
            default:
                return 'text-gray-500';
        }
    };

    // Get tags from metadata
    const getTags = (item: TimelineItem) => {
        const tags: string[] = [];
        if (item.metadata?.report_type) tags.push(item.metadata.report_type);
        if (item.metadata?.doctor_name) tags.push(item.metadata.doctor_name);
        if (item.type === 'prescription' && item.metadata?.medicines_count) {
            tags.push(`${item.metadata.medicines_count} medicines`);
        }
        return tags;
    };

    // Handle delete
    const handleDelete = async (item: TimelineItem) => {
        setIsDeleting(true);
        try {
            // If it's a demo item, just hide it locally
            if (item.id.startsWith('demo-')) {
                setDeletedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(item.id);
                    return newSet;
                });
                setDeleteConfirm(null);
                setIsDeleting(false);
                return;
            }

            if (item.type === 'prescription') {
                await apiClient.deletePrescription(item.id);
            } else if (item.type === 'report') {
                await apiClient.deleteReport(item.id);
            }
            setDeleteConfirm(null);
            refetch();
        } catch (err) {
            console.error('Error deleting item:', err);
            alert('Failed to delete. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle view - show details modal
    const handleView = (item: TimelineItem) => {
        setViewItem(item);
    };

    return (
        <div className="pb-24 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Timeline</h1>
                    <p className="text-gray-500 dark:text-gray-400">Your complete medical history in chronological order.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${(dateRange.start || dateRange.end) ? 'border-lime-500 text-lime-600' : 'border-gray-200 dark:border-neutral-800'}`}
                        >
                            <Calendar size={16} /> {(dateRange.start || dateRange.end) ? 'Filtered' : 'Date Range'}
                        </button>
                        {showDatePicker && (
                            <div className="absolute right-0 top-12 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-lg z-50 min-w-[280px]">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => { setDateRange({ start: '', end: '' }); setShowDatePicker(false); }}
                                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setShowDatePicker(false)}
                                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-lime-500 rounded-lg hover:bg-lime-400"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 mb-8 sticky top-24 z-30">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search reports, doctors, medicines..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'prescriptions', 'reports'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-colors ${filter === tab
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                                        : 'bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-lime-500" />
                    <span className="ml-3 text-gray-500">Loading your health timeline...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredTimeline.length === 0 && (
                <div className="text-center py-20">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {filter !== 'all' 
                            ? `No ${filter} found. Try a different filter.`
                            : 'Upload a prescription or health report to get started.'}
                    </p>
                </div>
            )}

            {/* Timeline */}
            {!loading && filteredTimeline.length > 0 && (
                <div className="relative border-l-2 border-gray-100 dark:border-neutral-800 ml-4 md:ml-8 space-y-12 pl-8 md:pl-12">
                    {filteredTimeline.map((item, i) => {
                        const { date, time } = formatDate(item.date);
                        const tags = getTags(item);
                        
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="relative"
                            >
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[45px] md:-left-[61px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-black ${item.type === 'report' ? 'bg-blue-500' : item.type === 'medicine' ? 'bg-purple-500' : 'bg-lime-500'
                                    } shadow-sm z-10`}></div>

                                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'report' 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                                : item.type === 'medicine'
                                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                : 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400'
                                                }`}>
                                                {item.type === 'report' ? <FileText size={24} /> : <File size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{item.title}</h3>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.description}</p>
                                                {tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{date}</div>
                                            <div className="text-xs text-gray-400">{time}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-neutral-800">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                                            {item.status?.replace('-', ' ') || 'Active'}
                                        </span>
                                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleView(item)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-500 hover:text-lime-600 transition-colors" 
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirm(item)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-600 transition-colors" 
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* View Details Modal */}
            <AnimatePresence>
                {viewItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setViewItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${viewItem.type === 'report' 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                                        : 'bg-lime-50 dark:bg-lime-900/20 text-lime-600'}`}>
                                        {viewItem.type === 'report' ? <FileText size={24} /> : <File size={24} />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{viewItem.title}</h2>
                                        <p className="text-sm text-gray-500">{formatDate(viewItem.date).date} at {formatDate(viewItem.date).time}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setViewItem(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Description */}
                            {viewItem.description && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Summary</h3>
                                    <p className="text-gray-700 dark:text-gray-300">{viewItem.description}</p>
                                </div>
                            )}

                            {/* For Reports - Show Lab Values */}
                            {viewItem.type === 'report' && viewItem.metadata?.lab_values && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Lab Values</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(viewItem.metadata.lab_values).map(([key, value]) => (
                                            <div key={key} className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-3">
                                                <div className="text-xs text-gray-500 uppercase">{key.replace(/_/g, ' ')}</div>
                                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* For Prescriptions - Show Doctor & Medicines Count */}
                            {viewItem.type === 'prescription' && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
                                    <div className="space-y-3">
                                        {viewItem.metadata?.doctor_name && (
                                            <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 rounded-xl p-3">
                                                <span className="text-gray-500">Doctor</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{viewItem.metadata.doctor_name}</span>
                                            </div>
                                        )}
                                        {viewItem.metadata?.medicines_count && (
                                            <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 rounded-xl p-3">
                                                <span className="text-gray-500">Medicines</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{viewItem.metadata.medicines_count} prescribed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* For Medicines - Show Dosage Info */}
                            {viewItem.type === 'medicine' && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Medication Details</h3>
                                    <div className="space-y-3">
                                        {viewItem.metadata?.dosage && (
                                            <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 rounded-xl p-3">
                                                <span className="text-gray-500">Dosage</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{viewItem.metadata.dosage}</span>
                                            </div>
                                        )}
                                        {viewItem.metadata?.frequency && (
                                            <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 rounded-xl p-3">
                                                <span className="text-gray-500">Frequency</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{viewItem.metadata.frequency}</span>
                                            </div>
                                        )}
                                        {viewItem.metadata?.timing && viewItem.metadata.timing.length > 0 && (
                                            <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 rounded-xl p-3">
                                                <span className="text-gray-500">Timing</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{viewItem.metadata.timing.join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-800">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(viewItem.status)} bg-gray-50 dark:bg-neutral-800`}>
                                    {viewItem.status?.replace('-', ' ') || 'Active'}
                                </span>
                                {viewItem.metadata?.file_url && (
                                    <a 
                                        href={viewItem.metadata.file_url} 
                                        target="_blank"
                                        className="flex items-center gap-2 px-4 py-2 bg-lime-500 text-black font-bold rounded-xl hover:bg-lime-400 transition-colors"
                                    >
                                        <Download size={16} /> View File
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => !isDeleting && setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete {deleteConfirm.type}?</h3>
                            <p className="text-center text-gray-500 mb-6">
                                Are you sure you want to delete &quot;{deleteConfirm.title}&quot;? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="w-4 h-4" /> Delete</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
