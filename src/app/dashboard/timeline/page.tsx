'use client';

import { useState } from 'react';
import { Search, Filter, Calendar, FileText, Download, Share2, MoreVertical, Eye, File } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_TIMELINE = [
    {
        id: 1,
        date: "Oct 24, 2024",
        time: "10:30 AM",
        type: "report",
        title: "Comprehensive Metabolic Panel",
        provider: "CityPath Labs",
        preview: "abnormal", // mock status
        tags: ["Diabetes", "Annual Checkup"]
    },
    {
        id: 2,
        date: "Oct 20, 2024",
        time: "04:15 PM",
        type: "prescription",
        title: "Antibiotics Course",
        provider: "Dr. Sarah Johnson",
        preview: "active",
        tags: ["Infection"]
    },
    {
        id: 3,
        date: "Sep 15, 2024",
        time: "09:00 AM",
        type: "report",
        title: "Lipid Profile",
        provider: "CityPath Labs",
        preview: "normal",
        tags: ["Heart Health"]
    }
];

export default function TimelinePage() {
    const [filter, setFilter] = useState('all');

    return (
        <div className="pb-24 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Timeline</h1>
                    <p className="text-gray-500 dark:text-gray-400">Your complete medical history in chronological order.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                        <Calendar size={16} /> Date Range
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                        <Download size={16} /> Export
                    </button>
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
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'prescriptions', 'reports', 'appointments'].map((tab) => (
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

            {/* Timeline */}
            <div className="relative border-l-2 border-gray-100 dark:border-neutral-800 ml-4 md:ml-8 space-y-12 pl-8 md:pl-12">
                {MOCK_TIMELINE.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                    >
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[45px] md:-left-[61px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-black ${item.type === 'report' ? 'bg-blue-500' : 'bg-lime-500'
                            } shadow-sm z-10`}></div>

                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'report' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400'
                                        }`}>
                                        {item.type === 'report' ? <FileText size={24} /> : <File size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{item.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.provider}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{item.date}</div>
                                    <div className="text-xs text-gray-400">{item.time}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-neutral-800">
                                <span className={`text-xs font-bold uppercase tracking-wider ${item.preview === 'abnormal' ? 'text-red-500' :
                                        item.preview === 'normal' ? 'text-green-500' : 'text-blue-500'
                                    }`}>
                                    {item.preview.replace('-', ' ')}
                                </span>
                                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-500 transition-colors" title="View Details">
                                        <Eye size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-500 transition-colors" title="Download">
                                        <Download size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-500 transition-colors" title="Share">
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
