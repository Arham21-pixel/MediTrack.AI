'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, ChevronRight, X, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    age: number;
    phone: string;
    email: string;
    avatarColor: string;
    initials: string;
    active: boolean;
}

const AVATAR_COLORS = [
    'bg-lime-200 text-lime-800',
    'bg-blue-200 text-blue-800',
    'bg-orange-200 text-orange-800',
    'bg-purple-200 text-purple-800',
    'bg-pink-200 text-pink-800',
    'bg-cyan-200 text-cyan-800',
    'bg-amber-200 text-amber-800',
    'bg-emerald-200 text-emerald-800',
];

const STORAGE_KEY = 'meditrack_family_members';

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRandomColor(): string {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export default function FamilyPage() {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<FamilyMember | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        relation: '',
        age: '',
        phone: '',
        email: '',
    });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setMembers(parsed);
                }
            } catch (e) {
                console.error('Failed to parse saved family members');
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever members change (only after initial load)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
        }
    }, [members, isLoaded]);

    const openAddModal = () => {
        setEditingMember(null);
        setFormData({ name: '', relation: '', age: '', phone: '', email: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (member: FamilyMember) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            relation: member.relation,
            age: member.age.toString(),
            phone: member.phone,
            email: member.email,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.relation.trim()) {
            return;
        }

        if (editingMember) {
            // Update existing member
            setMembers(prev => prev.map(m => 
                m.id === editingMember.id 
                    ? {
                        ...m,
                        name: formData.name,
                        relation: formData.relation,
                        age: parseInt(formData.age) || 0,
                        phone: formData.phone,
                        email: formData.email,
                        initials: getInitials(formData.name),
                    }
                    : m
            ));
        } else {
            // Add new member
            const newMember: FamilyMember = {
                id: Date.now().toString(),
                name: formData.name,
                relation: formData.relation,
                age: parseInt(formData.age) || 0,
                phone: formData.phone,
                email: formData.email,
                avatarColor: getRandomColor(),
                initials: getInitials(formData.name),
                active: members.length === 0, // First member is active
            };
            setMembers(prev => [...prev, newMember]);
        }

        setIsModalOpen(false);
        setFormData({ name: '', relation: '', age: '', phone: '', email: '' });
    };

    const handleDelete = (member: FamilyMember) => {
        setMembers(prev => prev.filter(m => m.id !== member.id));
        setDeleteConfirm(null);
    };

    const setActiveProfile = (memberId: string) => {
        setMembers(prev => prev.map(m => ({
            ...m,
            active: m.id === memberId
        })));
    };

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Members</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage health profiles for your loved ones.</p>
                </div>
                <Button onClick={openAddModal} className="gap-2">
                    <Plus size={18} /> Add Member
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {members.map((member) => (
                    <motion.div 
                        key={member.id} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden"
                        onClick={() => setActiveProfile(member.id)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${member.avatarColor}`}>
                                {member.initials}
                            </div>
                            <div className="flex items-center gap-2">
                                {member.active && (
                                    <span className="bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-bold px-2 py-1 rounded-full">
                                        Current Profile
                                    </span>
                                )}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openEditModal(member); }}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(member); }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{member.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{member.relation} • {member.age} years old</p>

                        <div className="space-y-2">
                            {member.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{member.phone}</span>
                                </div>
                            )}
                            {member.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Mail size={14} className="text-gray-400" />
                                    <span>{member.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Add New Card Placeholder */}
                <button 
                    onClick={openAddModal}
                    className="border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50/50 dark:hover:bg-lime-900/10 transition-all min-h-[200px]"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold">Add New Profile</span>
                </button>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingMember ? 'Edit Family Member' : 'Add Family Member'}
                                </h2>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                        placeholder="e.g., John Smith"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Relation *
                                        </label>
                                        <select
                                            value={formData.relation}
                                            onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                            required
                                        >
                                            <option value="">Select...</option>
                                            <option value="Self">Self</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Son">Son</option>
                                            <option value="Daughter">Daughter</option>
                                            <option value="Brother">Brother</option>
                                            <option value="Sister">Sister</option>
                                            <option value="Grandfather">Grandfather</option>
                                            <option value="Grandmother">Grandmother</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Age
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                            placeholder="e.g., 45"
                                            min="0"
                                            max="150"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                        placeholder="e.g., +1 (555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                                        placeholder="e.g., john@example.com"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition-colors"
                                    >
                                        {editingMember ? 'Save Changes' : 'Add Member'}
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
                                This will permanently remove this family member's profile.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
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
