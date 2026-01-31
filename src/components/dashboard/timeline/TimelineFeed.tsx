'use client';

import { Pill, FileText, CheckCircle2, XCircle } from 'lucide-react';

const EVENTS = [
    {
        id: 1,
        type: 'taken',
        title: 'Morning Meds',
        time: '8:00 AM',
        desc: 'Lisinopril, Vitamin D',
        status: 'success'
    },
    {
        id: 2,
        type: 'report',
        title: 'Lab Report Uploaded',
        time: '10:30 AM',
        desc: 'Blood Report - January 2024',
        status: 'neutral'
    },
    {
        id: 3,
        type: 'missed',
        title: 'Afternoon Dose',
        time: '2:00 PM',
        desc: 'Metformin',
        status: 'error'
    }
];

export function TimelineFeed() {
    return (
        <div className="space-y-6 relative ml-4">
            {/* Vertical Line */}
            <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-gray-100 -z-10" />

            {EVENTS.map((event) => (
                <div key={event.id} className="flex gap-4 items-start group">
                    <div className={`w-10 h-10 rounded-full border-4 border-gray-50 bg-white flex items-center justify-center shrink-0 z-10
            ${event.status === 'success' ? 'text-lime-500 shadow-sm' : ''}
            ${event.status === 'error' ? 'text-red-500 shadow-sm' : ''}
            ${event.status === 'neutral' ? 'text-blue-500 shadow-sm' : ''}
          `}>
                        {event.type === 'taken' && <Pill size={16} />}
                        {event.type === 'report' && <FileText size={16} />}
                        {event.type === 'missed' && <XCircle size={16} />}
                    </div>

                    <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900">{event.title}</h4>
                            <span className="text-xs font-mono text-gray-400">{event.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.desc}</p>

                        {event.status === 'success' && (
                            <div className="inline-flex items-center gap-1 text-xs font-bold text-lime-600 bg-lime-50 px-2 py-1 rounded-full">
                                <CheckCircle2 size={12} /> Taken on time
                            </div>
                        )}
                        {event.status === 'error' && (
                            <div className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                <XCircle size={12} /> Missed
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
