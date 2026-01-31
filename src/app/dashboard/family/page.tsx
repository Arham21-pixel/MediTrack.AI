'use client';

import { Users, Plus, Phone, Mail, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const FAMILY_MEMBERS = [
    {
        id: 1,
        name: 'John Doe',
        relation: 'Self',
        age: 45,
        avatarColor: 'bg-lime-200 text-lime-800',
        initials: 'JD',
        active: true
    },
    {
        id: 2,
        name: 'Martha Smith',
        relation: 'Mother',
        age: 72,
        avatarColor: 'bg-blue-200 text-blue-800',
        initials: 'MS',
        active: false
    },
    {
        id: 3,
        name: 'Robert Doe',
        relation: 'Father',
        age: 75,
        avatarColor: 'bg-orange-200 text-orange-800',
        initials: 'RD',
        active: false
    }
];

export default function FamilyPage() {
    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
                    <p className="text-gray-500">Manage health profiles for your loved ones.</p>
                </div>
                <Button className="gap-2">
                    <Plus size={18} /> Add Member
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FAMILY_MEMBERS.map((member) => (
                    <div key={member.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${member.avatarColor}`}>
                                {member.initials}
                            </div>
                            {member.active && (
                                <span className="bg-lime-100 text-lime-700 text-xs font-bold px-2 py-1 rounded-full">
                                    Current Profile
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">{member.relation} • {member.age} years old</p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                <span>+1 (555) 000-0000</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <span>email@example.com</span>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Card Placeholder */}
                <button className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50/50 transition-all min-h-[200px]">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-lime-100">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold">Add New Profile</span>
                </button>
            </div>
        </div>
    );
}
