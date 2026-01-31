'use client';

import { useState } from 'react';
import { User, Bell, Shield, Users, CreditCard, LogOut, ChevronRight, Smartphone, Mail, Globe, Lock, MoreVertical } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="pb-24 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your profile, preferences, and account security.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-2">
                    {['profile', 'notifications', 'family', 'security', 'billing'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                                }`}
                        >
                            {tab === 'profile' && <User size={18} />}
                            {tab === 'notifications' && <Bell size={18} />}
                            {tab === 'family' && <Users size={18} />}
                            {tab === 'security' && <Shield size={18} />}
                            {tab === 'billing' && <CreditCard size={18} />}
                            <span className="capitalize">{tab}</span>
                        </button>
                    ))}

                    <div className="pt-8 mt-8 border-t border-gray-100 dark:border-neutral-800">
                        <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preferences</h3>
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Globe size={16} /> Dark Mode
                            </div>
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-lime-500' : 'bg-gray-200'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    {activeTab === 'profile' && <ProfileSection />}
                    {activeTab === 'notifications' && <NotificationsSection />}
                    {activeTab === 'family' && <FamilySection />}
                    {/* Other sections can be placeholders for now */}
                    {activeTab === 'security' && <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">Security Settings Placeholder</div>}
                    {activeTab === 'billing' && <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">Billing Settings Placeholder</div>}
                </div>
            </div>
        </div>
    );
}

function ProfileSection() {
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-4xl font-bold text-gray-400">
                        JD
                    </div>
                    <div>
                        <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold mb-2">Change Avatar</button>
                        <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size of 800K</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" defaultValue="John Doe" className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                        <input type="email" defaultValue="john@example.com" className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                        <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Date of Birth</label>
                        <input type="date" className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Medical Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Blood Type</label>
                        <select className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors">
                            <option>A+</option>
                            <option>O+</option>
                            <option>B+</option>
                            <option>AB+</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Allergies</label>
                        <input type="text" placeholder="e.g. Penicillin, Peanuts" className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" />
                    </div>
                </div>
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-red-700 dark:text-red-400">Emergency Health Card</h4>
                        <p className="text-xs text-red-600/80 dark:text-red-400/70">Generate a printable card with your vital info.</p>
                    </div>
                    <button className="px-4 py-2 bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 font-bold text-sm rounded-lg shadow-sm border border-red-100 dark:border-neutral-800 hover:bg-red-50 transition-colors">Generate</button>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button className="px-6 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl transition-colors">Cancel</button>
                <button className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-lime-500/20">Save Changes</button>
            </div>
        </div>
    );
}

function NotificationsSection() {
    return (
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Push Notifications</h3>
                            <p className="text-sm text-gray-500">Receive alerts on your mobile device.</p>
                        </div>
                    </div>
                    {/* Placeholder Toggle */}
                    <div className="w-12 h-6 bg-lime-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Email Reminders</h3>
                            <p className="text-sm text-gray-500">Weekly summaries and missed dose alerts.</p>
                        </div>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 dark:bg-neutral-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </div>
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Alert Types</h3>
                <div className="space-y-4">
                    {['Missed Meds', 'Low Supply Warning', 'Lab Results Ready', 'Family Updates'].map((item) => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-5 h-5 text-lime-500 rounded focus:ring-lime-500 border-gray-300" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

function FamilySection() {
    return (
        <div className="space-y-6">
            <div className="bg-lime-50 dark:bg-lime-900/10 p-6 rounded-3xl border border-lime-100 dark:border-lime-900/30 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Family Sharing is Active</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">2 family members have access to your health data.</p>
                </div>
                <button className="px-4 py-2 bg-lime-500 text-black font-bold rounded-xl text-sm shadow-sm hover:bg-lime-400">Invite New</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            SJ
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Sarah Jenkins</h4>
                            <p className="text-xs text-gray-500">Daughter • Admin Access</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <MoreVertical size={20} />
                    </button>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            MJ
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Mark Jenkins</h4>
                            <p className="text-xs text-gray-500">Son • View Only (Alerts)</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
