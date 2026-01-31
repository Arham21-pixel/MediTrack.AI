'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MedicalCalendar() {
    // Mock status: 0 = none, 1 = taken (green), 2 = missed (red), 3 = partial (yellow)
    const MOCK_MONTH_DATA = Array.from({ length: 31 }, (_, i) => {
        // Use a consistent seed or logic instead of random to avoid hydration mismatch, 
        // OR standard practice for mock data: just hardcode a pattern if true randomness isn't needed per render.
        // For now, let's use a deterministic pattern based on the day.
        const day = i + 1;
        if (day % 7 === 0 || day % 4 === 0) return { day, status: 2 }; // Missed pattern
        if (day % 3 <= 1) return { day, status: 1 }; // Taken pattern
        return { day, status: 0 }; // None/Future
    });

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg">January 2024</h3>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                {DAYS.map(day => (
                    <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        {day}
                    </div>
                ))}

                {/* Placeholder for empty start days */}
                <div className="col-span-2"></div>

                {MOCK_MONTH_DATA.map((item) => (
                    <div key={item.day} className="flex flex-col items-center gap-1 group cursor-pointer">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${item.status === 1 ? 'bg-lime-500 text-white shadow-lg shadow-lime-200' : ''}
                    ${item.status === 2 ? 'bg-red-50 text-red-500 border border-red-100' : ''}
                    ${item.status === 0 ? 'text-gray-600 hover:bg-gray-100' : ''}
                `}>
                            {item.day}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 justify-center mt-8 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-lime-500"></span> Taken</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Missed</div>
            </div>
        </div>
    );
}
