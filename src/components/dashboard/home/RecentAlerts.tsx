'use client';

import { Activity, AlertTriangle, Calendar } from 'lucide-react';

export function RecentAlerts() {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Alerts</h2>
            <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Missed Morning Dose</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Metformin 500mg • 8:00 AM</p>
                        <button className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Mark as Taken</button>
                    </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Slightly High Cholesterol</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From "Annual Blood Work" • Yesterday</p>
                        <button className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline">View Report</button>
                    </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Dr. Smith Appointment</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Teleconsultation • Tomorrow, 10:00 AM</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
