'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, Users, LogOut, ChevronRight, Smartphone, Mail, Globe, Lock, MoreVertical, Loader2, Check, X, Trash2, Copy, UserPlus, Heart, Droplet, AlertTriangle, Phone, Printer, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="pb-24 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your profile, preferences, and account security.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-2">
                    {['profile', 'notifications', 'family', 'security'].map((tab) => (
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

                        {isAuthenticated && (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-4"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    {activeTab === 'profile' && <ProfileSection />}
                    {activeTab === 'notifications' && <NotificationsSection />}
                    {activeTab === 'family' && <FamilySection />}
                    {activeTab === 'security' && <SecuritySection />}
                </div>
            </div>
        </div>
    );
}

function ProfileSection() {
    const { user, updateProfile, isAuthenticated } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showHealthCard, setShowHealthCard] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Load user data when component mounts or user changes
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
            setDateOfBirth(user.date_of_birth || '');
            setBloodType(user.blood_type || '');
            setAllergies(user.allergies || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!isAuthenticated) return;
        
        setSaving(true);
        try {
            // Only send fields that have values (not empty strings)
            const profileData: { 
                name?: string; 
                phone?: string; 
                date_of_birth?: string; 
                blood_type?: string; 
                allergies?: string; 
            } = {};
            
            if (name.trim()) profileData.name = name.trim();
            if (phone.trim()) profileData.phone = phone.trim();
            if (dateOfBirth) profileData.date_of_birth = dateOfBirth;
            if (bloodType) profileData.blood_type = bloodType;
            if (allergies.trim()) profileData.allergies = allergies.trim();
            
            console.log('Saving profile data:', profileData);
            const updatedUser = await updateProfile(profileData);
            console.log('Profile updated, received:', updatedUser);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Get initials from name or email
    const getInitials = () => {
        if (name) {
            const parts = name.split(' ');
            return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return 'U';
    };

    // Calculate age from date of birth
    const calculateAge = () => {
        if (!dateOfBirth) return null;
        const birth = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Print the health card
    const handlePrintCard = () => {
        const printContent = cardRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Emergency Health Card - ${name || 'MediTrack'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page {
                        size: 3.5in 2.25in;
                        margin: 0;
                    }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: #f5f5f5;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .card {
                        width: 3.375in;
                        height: 2.125in;
                        background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
                        border-radius: 12px;
                        padding: 14px;
                        color: white !important;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    }
                    .decoration-1 {
                        position: absolute;
                        top: -30px;
                        right: -30px;
                        width: 100px;
                        height: 100px;
                        background: rgba(255,255,255,0.15) !important;
                        border-radius: 50%;
                    }
                    .decoration-2 {
                        position: absolute;
                        bottom: -20px;
                        left: -20px;
                        width: 70px;
                        height: 70px;
                        background: rgba(255,255,255,0.08) !important;
                        border-radius: 50%;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        margin-bottom: 10px;
                        position: relative;
                        z-index: 1;
                    }
                    .header svg {
                        width: 16px;
                        height: 16px;
                        fill: white;
                    }
                    .header h1 {
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                        color: white !important;
                    }
                    .content {
                        position: relative;
                        z-index: 1;
                    }
                    .name {
                        font-size: 16px;
                        font-weight: 700;
                        margin-bottom: 10px;
                        color: white !important;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 6px;
                    }
                    .info-item {
                        display: flex;
                        flex-direction: column;
                    }
                    .info-label {
                        opacity: 0.85;
                        font-size: 7px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: white !important;
                        display: flex;
                        align-items: center;
                        gap: 3px;
                    }
                    .info-label svg {
                        width: 8px;
                        height: 8px;
                    }
                    .info-value {
                        font-weight: 600;
                        font-size: 10px;
                        color: white !important;
                    }
                    .allergies {
                        margin-top: 8px;
                        padding-top: 6px;
                        border-top: 1px solid rgba(255,255,255,0.3) !important;
                    }
                    .allergies-label {
                        font-size: 7px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        opacity: 0.85;
                        display: flex;
                        align-items: center;
                        gap: 3px;
                        color: white !important;
                    }
                    .allergies-value {
                        font-size: 9px;
                        font-weight: 600;
                        margin-top: 2px;
                        color: white !important;
                    }
                    .footer {
                        position: absolute;
                        bottom: 8px;
                        right: 14px;
                        font-size: 7px;
                        opacity: 0.7;
                        color: white !important;
                    }
                    @media print {
                        html, body {
                            width: 3.375in;
                            height: 2.125in;
                            margin: 0;
                            padding: 0;
                            background: white !important;
                        }
                        body {
                            display: block;
                            min-height: auto;
                        }
                        .card { 
                            box-shadow: none;
                            border-radius: 10px;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="decoration-1"></div>
                    <div class="decoration-2"></div>
                    <div class="header">
                        <svg viewBox="0 0 24 24" fill="white">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                        <h1>EMERGENCY HEALTH CARD</h1>
                    </div>
                    <div class="content">
                        <div class="name">${name || 'Name Not Set'}</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">
                                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2v6m0 12v-6m0 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>
                                    Blood Type
                                </span>
                                <span class="info-value">${bloodType || 'Not Set'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Age</span>
                                <span class="info-value">${calculateAge() !== null ? calculateAge() + ' years' : 'Not Set'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                    Emergency Contact
                                </span>
                                <span class="info-value">${phone || 'Not Set'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">DOB</span>
                                <span class="info-value">${dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'Not Set'}</span>
                            </div>
                        </div>
                        <div class="allergies">
                            <div class="allergies-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                    <path d="M12 9v4"/>
                                    <path d="M12 17h.01"/>
                                </svg>
                                Allergies
                            </div>
                            <div class="allergies-value">${allergies || 'None'}</div>
                        </div>
                    </div>
                    <div class="footer">MediTrack</div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                
                {!isAuthenticated && (
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            You're in demo mode. <a href="/login" className="font-bold underline">Login</a> or <a href="/signup" className="font-bold underline">sign up</a> to save your profile.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-3xl font-bold text-lime-700 dark:text-lime-400">
                        {getInitials()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{name || 'Your Name'}</h3>
                        <p className="text-sm text-gray-500">{email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 cursor-not-allowed" 
                        />
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                        <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Date of Birth</label>
                        <input 
                            type="date" 
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Medical Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Blood Type</label>
                        <select 
                            value={bloodType}
                            onChange={(e) => setBloodType(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors"
                        >
                            <option value="">Select Blood Type</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Allergies</label>
                        <input 
                            type="text" 
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="e.g. Penicillin, Peanuts" 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" 
                        />
                    </div>
                </div>
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-red-700 dark:text-red-400">Emergency Health Card</h4>
                        <p className="text-xs text-red-600/80 dark:text-red-400/70">Generate a printable card with your vital info.</p>
                    </div>
                    <button 
                        onClick={() => setShowHealthCard(true)}
                        className="px-4 py-2 bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 font-bold text-sm rounded-lg shadow-sm border border-red-100 dark:border-neutral-800 hover:bg-red-50 transition-colors"
                    >
                        Generate
                    </button>
                </div>
            </div>

            {/* Emergency Health Card Modal */}
            <AnimatePresence>
                {showHealthCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowHealthCard(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Emergency Health Card</h3>
                                <button
                                    onClick={() => setShowHealthCard(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Card Preview */}
                            <div ref={cardRef} className="relative w-full aspect-[1.586] bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-4 text-white overflow-hidden shadow-lg mb-6">
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                                
                                {/* Header */}
                                <div className="relative flex items-center gap-2 mb-3">
                                    <Heart size={18} fill="white" />
                                    <span className="text-xs font-bold tracking-wide">EMERGENCY HEALTH CARD</span>
                                </div>

                                {/* Content */}
                                <div className="relative">
                                    <h4 className="text-lg font-bold mb-3">{name || 'Name Not Set'}</h4>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <div className="opacity-70 text-[10px] uppercase tracking-wide flex items-center gap-1">
                                                <Droplet size={10} />
                                                Blood Type
                                            </div>
                                            <div className="font-semibold">{bloodType || 'Not Set'}</div>
                                        </div>
                                        <div>
                                            <div className="opacity-70 text-[10px] uppercase tracking-wide">Age</div>
                                            <div className="font-semibold">{calculateAge() !== null ? `${calculateAge()} years` : 'Not Set'}</div>
                                        </div>
                                        <div>
                                            <div className="opacity-70 text-[10px] uppercase tracking-wide flex items-center gap-1">
                                                <Phone size={10} />
                                                Emergency Contact
                                            </div>
                                            <div className="font-semibold">{phone || 'Not Set'}</div>
                                        </div>
                                        <div>
                                            <div className="opacity-70 text-[10px] uppercase tracking-wide">DOB</div>
                                            <div className="font-semibold">{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'Not Set'}</div>
                                        </div>
                                    </div>

                                    {allergies && (
                                        <div className="mt-3 pt-2 border-t border-white/30">
                                            <div className="opacity-70 text-[10px] uppercase tracking-wide flex items-center gap-1">
                                                <AlertTriangle size={10} />
                                                Allergies
                                            </div>
                                            <div className="font-semibold text-xs">{allergies}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="absolute bottom-3 right-4 text-[10px] opacity-60">MediTrack</div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowHealthCard(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handlePrintCard}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Printer size={18} />
                                    Print Card
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                                Print this card and keep it in your wallet for emergencies.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-end gap-4">
                <button className="px-6 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl transition-colors">Cancel</button>
                <button 
                    onClick={handleSave}
                    disabled={saving || !isAuthenticated}
                    className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-lime-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <Check size={18} />
                            Saved!
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </div>
    );
}

function SecuritySection() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { user, isAuthenticated } = useAuth();
    
    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Email verification modal
    const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
    const [verifyEmail, setVerifyEmail] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailError, setEmailError] = useState('');
    
    // Confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleVerifyEmail = () => {
        if (verifyEmail.toLowerCase() === user?.email?.toLowerCase()) {
            setEmailVerified(true);
            setShowEmailVerifyModal(false);
            setShowCurrentPassword(true);
            setEmailError('');
        } else {
            setEmailError('Email does not match your account');
        }
    };

    const handleToggleCurrentPassword = () => {
        if (!showCurrentPassword && !emailVerified) {
            setShowEmailVerifyModal(true);
            setVerifyEmail('');
            setEmailError('');
        } else {
            setShowCurrentPassword(!showCurrentPassword);
        }
    };

    const handleChangePassword = async () => {
        if (!isAuthenticated) return;
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        // Show confirmation modal
        setShowConfirmModal(true);
    };

    const confirmPasswordChange = async () => {
        setShowConfirmModal(false);
        setSaving(true);
        try {
            const { apiClient } = await import('@/lib/api-client');
            await apiClient.changePassword(currentPassword, newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully! Use your new password next time you login.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setEmailVerified(false);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Settings</h2>

            {!isAuthenticated && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        You're in demo mode. <a href="/login" className="font-bold underline">Login</a> to manage security settings.
                    </p>
                </div>
            )}

            {message && (
                <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400'}`}>
                    <p className="text-sm">{message.text}</p>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Change Password</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Current Password</label>
                        <div className="relative">
                            <input 
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" 
                            />
                            <button
                                type="button"
                                onClick={handleToggleCurrentPassword}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                title={showCurrentPassword ? "Hide password" : "Show password (requires email verification)"}
                            >
                                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {!emailVerified && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click the eye icon and verify your email to view password</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">New Password</label>
                        <div className="relative">
                            <input 
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Confirm New Password</label>
                        <div className="relative">
                            <input 
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500">Passwords do not match</p>
                        )}
                        {newPassword && confirmPassword && newPassword === confirmPassword && (
                            <p className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> Passwords match</p>
                        )}
                    </div>
                </div>
                <button 
                    onClick={handleChangePassword}
                    disabled={saving || !isAuthenticated || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                    className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-lime-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Updating...
                        </>
                    ) : (
                        'Update Password'
                    )}
                </button>
            </div>

            {/* Email Verification Modal */}
            <AnimatePresence>
                {showEmailVerifyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowEmailVerifyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
                                        <Mail size={20} className="text-lime-600 dark:text-lime-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verify Your Identity</h3>
                                </div>
                                <button
                                    onClick={() => setShowEmailVerifyModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                For security, please enter the email address associated with your account to view your current password.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={verifyEmail}
                                        onChange={(e) => {
                                            setVerifyEmail(e.target.value);
                                            setEmailError('');
                                        }}
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-lime-500 transition-colors"
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmail()}
                                    />
                                    {emailError && (
                                        <p className="text-xs text-red-500">{emailError}</p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowEmailVerifyModal(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleVerifyEmail}
                                        disabled={!verifyEmail}
                                        className="flex-1 px-4 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Password Change Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                    <Shield size={24} className="text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Password Change</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Are you sure you want to change your password? You will need to use your <span className="font-bold text-gray-900 dark:text-white">new password</span> the next time you sign in.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPasswordChange}
                                    className="flex-1 px-4 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check size={18} />
                                    Confirm Change
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NotificationsSection() {
    const NOTIFICATIONS_STORAGE_KEY = 'meditrack_notification_settings';
    const { user, isAuthenticated } = useAuth();
    
    const [settings, setSettings] = useState({
        pushNotifications: true,
        emailReminders: false,
        missedMeds: true,
        lowSupply: true,
        labResults: true,
        familyUpdates: true,
        emailAddress: '',
    });
    const [saved, setSaved] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [emailTestResult, setEmailTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [sendingWeeklySummary, setSendingWeeklySummary] = useState(false);

    // Load settings and auto-populate email from user profile
    useEffect(() => {
        // First set the email from user profile if authenticated
        if (user?.email) {
            setSettings(prev => ({ ...prev, emailAddress: user.email }));
        }
        
        // Then load any saved settings from localStorage (but keep user email)
        const savedSettings = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                // Don't override email if user is logged in
                if (user?.email) {
                    parsed.emailAddress = user.email;
                }
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to parse notification settings');
            }
        }
    }, [user?.email]);

    // Save settings to localStorage whenever they change
    const updateSetting = (key: keyof typeof settings, value: boolean | string) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newSettings));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    const sendTestEmail = async () => {
        const emailToUse = settings.emailAddress || user?.email;
        if (!emailToUse) {
            setEmailTestResult({ success: false, message: 'No email address available. Please log in or enter an email.' });
            return;
        }

        setTestingEmail(true);
        setEmailTestResult(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/notifications/email/test?email=${encodeURIComponent(emailToUse)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            const result = await response.json();
            
            if (result.success) {
                setEmailTestResult({ success: true, message: `Test email sent to ${emailToUse}! Check your inbox.` });
            } else {
                setEmailTestResult({ success: false, message: result.error || result.detail || 'Failed to send test email' });
            }
        } catch (error) {
            setEmailTestResult({ success: false, message: 'Could not connect to server. Make sure the backend is running on port 8000.' });
        } finally {
            setTestingEmail(false);
        }
    };

    const sendWeeklySummary = async () => {
        const emailToUse = settings.emailAddress || user?.email;
        if (!emailToUse) {
            setEmailTestResult({ success: false, message: 'No email address available.' });
            return;
        }

        setSendingWeeklySummary(true);
        setEmailTestResult(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/notifications/email/weekly-summary?email=${encodeURIComponent(emailToUse)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            const result = await response.json();
            
            if (result.success) {
                setEmailTestResult({ success: true, message: `Weekly summary sent to ${emailToUse}!` });
            } else {
                setEmailTestResult({ success: false, message: result.error || result.detail || 'Failed to send weekly summary' });
            }
        } catch (error) {
            setEmailTestResult({ success: false, message: 'Could not connect to server.' });
        } finally {
            setSendingWeeklySummary(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
                <AnimatePresence>
                    {saved && (
                        <motion.span 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1 text-sm text-lime-600 dark:text-lime-400 font-medium"
                        >
                            <Check size={16} /> Saved
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Logged-in user email display */}
            {isAuthenticated && user?.email && (
                <div className="p-4 bg-lime-50 dark:bg-lime-900/10 border border-lime-100 dark:border-lime-900/30 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-lime-100 dark:bg-lime-900/30 rounded-lg text-lime-600 dark:text-lime-400">
                            <Mail size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Notifications will be sent to:</p>
                            <p className="text-lime-600 dark:text-lime-400 font-bold">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}

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
                    <button 
                        onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.pushNotifications ? 'bg-lime-500' : 'bg-gray-200 dark:bg-neutral-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.pushNotifications ? 'right-1' : 'left-1'}`}></div>
                    </button>
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
                    <button 
                        onClick={() => updateSetting('emailReminders', !settings.emailReminders)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.emailReminders ? 'bg-lime-500' : 'bg-gray-200 dark:bg-neutral-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.emailReminders ? 'right-1' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>

            {/* Email Configuration */}
            {settings.emailReminders && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30 space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address for Notifications
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={settings.emailAddress}
                                onChange={(e) => updateSetting('emailAddress', e.target.value)}
                                placeholder={user?.email || "Enter your email"}
                                disabled={isAuthenticated && !!user?.email}
                                className={`flex-1 px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${isAuthenticated && user?.email ? 'bg-gray-50 dark:bg-neutral-800/50 cursor-not-allowed' : ''}`}
                            />
                            <button
                                onClick={sendTestEmail}
                                disabled={testingEmail || (!settings.emailAddress && !user?.email)}
                                className="px-4 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {testingEmail ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Test'
                                )}
                            </button>
                        </div>
                        {isAuthenticated && user?.email && (
                            <p className="text-xs text-gray-500 mt-1">Using your logged-in email address</p>
                        )}
                    </div>
                    
                    {/* Send Weekly Summary Button */}
                    <div className="pt-2 border-t border-orange-200 dark:border-orange-900/30">
                        <button
                            onClick={sendWeeklySummary}
                            disabled={sendingWeeklySummary || (!settings.emailAddress && !user?.email)}
                            className="w-full px-4 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {sendingWeeklySummary ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Sending Summary...
                                </>
                            ) : (
                                <>
                                    <Mail size={16} />
                                    Send Weekly Summary Now
                                </>
                            )}
                        </button>
                    </div>

                    {emailTestResult && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-sm ${emailTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                            {emailTestResult.success ? '✅' : '❌'} {emailTestResult.message}
                        </motion.p>
                    )}
                </motion.div>
            )}

            <div className="pt-8 border-t border-gray-100 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Alert Types</h3>
                <div className="space-y-4">
                    {[
                        { key: 'missedMeds', label: 'Missed Meds' },
                        { key: 'familyUpdates', label: 'Family Updates' }
                    ].map((item) => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={settings[item.key as keyof typeof settings] as boolean} 
                                onChange={(e) => updateSetting(item.key as keyof typeof settings, e.target.checked)}
                                className="w-5 h-5 text-lime-500 rounded focus:ring-lime-500 border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800" 
                            />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

function FamilySection() {
    const FAMILY_SHARING_KEY = 'meditrack_family_sharing';
    
    interface SharedMember {
        id: string;
        name: string;
        email: string;
        relation: string;
        accessLevel: 'admin' | 'view-only' | 'alerts-only';
        avatarColor: string;
        initials: string;
        invitedAt: string;
        status: 'pending' | 'accepted';
    }

    const [members, setMembers] = useState<SharedMember[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<SharedMember | null>(null);
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        relation: '',
        accessLevel: 'view-only' as 'admin' | 'view-only' | 'alerts-only',
    });

    const AVATAR_COLORS = [
        'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
        'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    ];

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const getRandomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(FAMILY_SHARING_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setMembers(parsed);
                }
            } catch (e) {
                console.error('Failed to parse family sharing data');
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage only after initial load
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(FAMILY_SHARING_KEY, JSON.stringify(members));
        }
    }, [members, isLoaded]);

    const generateInviteLink = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setInviteLink(`https://meditrack.app/invite/${code}`);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) return;

        setSendingInvite(true);

        const newMember: SharedMember = {
            id: Date.now().toString(),
            name: formData.name,
            email: formData.email,
            relation: formData.relation || 'Family',
            accessLevel: formData.accessLevel,
            avatarColor: getRandomColor(),
            initials: getInitials(formData.name),
            invitedAt: new Date().toISOString(),
            status: 'pending',
        };

        // Try to send email invite via API
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('http://localhost:8000/api/notifications/family/invite', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        name: formData.name,
                        relation: formData.relation || 'Family',
                        access_level: formData.accessLevel
                    })
                });
            }
        } catch (error) {
            console.log('Email invite API not available, continuing with local storage');
        }

        // Add to local state
        setMembers(prev => [...prev, newMember]);
        setSendingInvite(false);
        setInviteSuccess(true);
        
        setTimeout(() => {
            setIsInviteModalOpen(false);
            setInviteSuccess(false);
            setFormData({ name: '', email: '', relation: '', accessLevel: 'view-only' });
        }, 1500);
    };

    const handleRemove = (member: SharedMember) => {
        setMembers(prev => prev.filter(m => m.id !== member.id));
        setDeleteConfirm(null);
    };

    const getAccessLabel = (level: string) => {
        switch (level) {
            case 'admin': return 'Admin Access';
            case 'view-only': return 'View Only';
            case 'alerts-only': return 'Alerts Only';
            default: return level;
        }
    };

    return (
        <div className="space-y-6">
            <div className={`p-6 rounded-3xl border flex items-center justify-between ${members.length > 0 ? 'bg-lime-50 dark:bg-lime-900/10 border-lime-100 dark:border-lime-900/30' : 'bg-gray-50 dark:bg-neutral-800/50 border-gray-100 dark:border-neutral-800'}`}>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {members.length > 0 ? 'Family Sharing is Active' : 'No Family Members Yet'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {members.length > 0 
                            ? `${members.length} family member${members.length > 1 ? 's' : ''} have access to your health data.`
                            : 'Invite family members to view your health data and receive alerts.'
                        }
                    </p>
                </div>
                <button 
                    onClick={() => { setIsInviteModalOpen(true); generateInviteLink(); }}
                    className="px-4 py-2 bg-lime-500 text-black font-bold rounded-xl text-sm shadow-sm hover:bg-lime-400 flex items-center gap-2"
                >
                    <UserPlus size={16} /> Invite New
                </button>
            </div>

            {members.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    {members.map((member) => (
                        <motion.div 
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${member.avatarColor}`}>
                                    {member.initials}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{member.name}</h4>
                                        {member.status === 'pending' && (
                                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">Pending</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{member.relation} • {getAccessLabel(member.accessLevel)}</p>
                                    <p className="text-xs text-gray-400">{member.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setDeleteConfirm(member)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {members.length === 0 && (
                <div className="bg-white dark:bg-neutral-900 p-12 rounded-3xl border border-gray-100 dark:border-neutral-800 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={28} className="text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Share with Family</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                        Invite trusted family members to view your health data, receive medication reminders, and stay informed about your health.
                    </p>
                    <button 
                        onClick={() => { setIsInviteModalOpen(true); generateInviteLink(); }}
                        className="px-6 py-3 bg-lime-500 text-black font-bold rounded-xl text-sm shadow-lg shadow-lime-500/20 hover:bg-lime-400 inline-flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Invite Family Member
                    </button>
                </div>
            )}

            {/* Invite Modal */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsInviteModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite Family Member</h2>
                                <button 
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                        placeholder="e.g., Jane Smith"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                        placeholder="jane@example.com"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relation</label>
                                        <select
                                            value={formData.relation}
                                            onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Son">Son</option>
                                            <option value="Daughter">Daughter</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Sibling">Sibling</option>
                                            <option value="Caregiver">Caregiver</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Level</label>
                                        <select
                                            value={formData.accessLevel}
                                            onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                        >
                                            <option value="admin">Admin Access</option>
                                            <option value="view-only">View Only</option>
                                            <option value="alerts-only">Alerts Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-neutral-800">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or share invite link</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inviteLink}
                                            readOnly
                                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={copyLink}
                                            className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors ${linkCopied ? 'bg-lime-500 text-black' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
                                        >
                                            {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                                            {linkCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviteModalOpen(false)}
                                        disabled={sendingInvite}
                                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingInvite || inviteSuccess}
                                        className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${inviteSuccess ? 'bg-green-500 text-white' : 'bg-lime-500 text-black hover:bg-lime-400'} disabled:opacity-80`}
                                    >
                                        {sendingInvite ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Sending...
                                            </>
                                        ) : inviteSuccess ? (
                                            <>
                                                <Check size={18} />
                                                Invite Sent!
                                            </>
                                        ) : (
                                            'Send Invite'
                                        )}
                                    </button>
                                </div>
                            </form>
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
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                                Remove {deleteConfirm.name}?
                            </h3>
                            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                                They will no longer have access to your health data.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleRemove(deleteConfirm)}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
