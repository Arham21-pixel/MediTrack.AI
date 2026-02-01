'use client';

import { FileText, Pill, ClipboardList, Loader2, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTimeline, TimelineItem } from '@/lib/api-client';
import Link from 'next/link';

const getItemIcon = (type: string) => {
    switch (type) {
        case 'prescription':
            return { icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
        case 'report':
            return { icon: FileText, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' };
        case 'medicine':
            return { icon: Pill, color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-50 dark:bg-lime-900/20' };
        default:
            return { icon: FileText, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    }
};

const getStatusBadge = (status?: string) => {
    switch (status) {
        case 'normal':
            return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">Normal</span>;
        case 'warning':
            return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-medium flex items-center gap-0.5"><AlertTriangle size={8} /> Warning</span>;
        case 'critical':
            return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">Critical</span>;
        case 'active':
            return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 font-medium flex items-center gap-0.5"><CheckCircle size={8} /> Active</span>;
        case 'completed':
            return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">Completed</span>;
        default:
            return null;
    }
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function TimelinePreview() {
    const { timeline, loading, error } = useTimeline(5);

    if (loading) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Health Timeline</h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-lime-500" />
                    <span className="ml-2 text-sm text-gray-500">Loading timeline...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Health Timeline</h2>
                <Link
                    href="/dashboard/timeline"
                    className="text-sm font-bold text-lime-600 dark:text-lime-400 hover:underline flex items-center gap-1"
                >
                    View All <ChevronRight size={14} />
                </Link>
            </div>

            <div className="space-y-0">
                {timeline.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FileText size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No health records yet</p>
                        <p className="text-xs mt-1">Upload a prescription to get started</p>
                    </div>
                ) : (
                    timeline.slice(0, 4).map((item, i) => {
                        const { icon: ItemIcon, color, bg } = getItemIcon(item.type);

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-4 p-4 border-b border-gray-50 dark:border-neutral-800 last:border-0 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer rounded-xl group"
                            >
                                <div className={`w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center font-bold text-xs shrink-0`}>
                                    <ItemIcon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">
                                            {item.title}
                                        </span>
                                        {getStatusBadge(item.status)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {item.description || 'No description'} • {formatTimeAgo(item.date)}
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-lime-500 transition-colors shrink-0" />
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
