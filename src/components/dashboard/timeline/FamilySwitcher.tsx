'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAMILY_MEMBERS = [
    { id: 1, name: 'John Doe', initials: 'JD', color: 'bg-lime-200 text-lime-800' },
    { id: 2, name: 'Martha S.', initials: 'MS', color: 'bg-blue-200 text-blue-800' },
    { id: 3, name: 'Robert D.', initials: 'RD', color: 'bg-orange-200 text-orange-800' },
];

export function FamilySwitcher() {
    const [activeId, setActiveId] = useState(1);
    const activeName = FAMILY_MEMBERS.find(m => m.id === activeId)?.name;

    return (
        <div className="flex items-center gap-4 mb-8">
            <div className="flex -space-x-3">
                {FAMILY_MEMBERS.map((member) => (
                    <button
                        key={member.id}
                        onClick={() => setActiveId(member.id)}
                        className={cn(
                            "w-12 h-12 rounded-full border-4 border-gray-50 flex items-center justify-center font-bold text-sm hover:scale-110 transition-transform relative",
                            member.color,
                            member.id === activeId ? 'ring-2 ring-offset-2 ring-lime-500 z-20 scale-105' : 'opacity-70 hover:opacity-100 z-10'
                        )}
                        title={member.name}
                    >
                        {member.initials}
                    </button>
                ))}
                <button className="w-12 h-12 rounded-full border-4 border-gray-50 bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors z-0">
                    <Plus size={20} />
                </button>
            </div>
            <div>
                <div className="text-sm font-bold text-gray-900">Viewing: {activeName}</div>
                <div className="text-xs text-gray-500">Switch profile</div>
            </div>
        </div>
    );
}
