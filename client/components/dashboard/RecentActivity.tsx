'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    UserPlus, 
    CreditCard, 
    BookOpen, 
    Bell, 
    CheckCircle2, 
    AlertCircle,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
    id: string;
    type: string;
    title?: string;
    description: string;
    timestamp?: string;
    time?: string;
    status?: string;
}

interface RecentActivityProps {
    activities: Activity[];
}

const ICON_MAP: Record<string, { icon: any, color: string, bg: string }> = {
    ADMISSION: { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    FEE_PAYMENT: { icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    EXAM: { icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    NOTIFICATION: { icon: Bell, color: 'text-primary', bg: 'bg-primary/10' },
    OTHER: { icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
    return (
        <div className="space-y-4">
            {activities.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No recent transmissions</p>
                </div>
            ) : (
                activities.map((activity, idx) => {
                    const cfg = ICON_MAP[activity.type] || ICON_MAP.OTHER;
                    const Icon = cfg.icon;
                    const timeValue = activity.timestamp || activity.time || new Date().toISOString();

                    return (
                        <motion.div 
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group flex items-start gap-4 p-4 rounded-2xl glass hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-primary/10"
                        >
                            <div className={cn("p-2.5 rounded-xl shrink-0 transition-colors group-hover:bg-primary group-hover:text-white", cfg.bg, cfg.color)}>
                                <Icon size={18} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                        {activity.title || activity.type}
                                    </h4>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
                                        {new Date(timeValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                    {activity.description}
                                </p>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <ArrowUpRight size={14} className="text-primary" />
                            </div>
                        </motion.div>
                    );
                })
            )}
        </div>
    );
};
