'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface DashboardHeaderProps {
    title: string;
    subtitle: string;
    today: string;
    onRefresh: () => Promise<void> | void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, today, onRefresh }) => {
    const { user } = useAuth();
    
    const timeOfDay = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="relative mb-10">
            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <div className="h-2 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Intelligence Console</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic"
                    >
                        {title}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 dark:text-slate-400 font-medium max-w-xl"
                    >
                        {subtitle}
                    </motion.p>
                </div>

                {/* Status Pills */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-3"
                >
                    <div className="glass px-5 py-3 rounded-2xl flex items-center gap-3 ring-1 ring-primary/10 shadow-sm">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Calendar size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                            {dateStr}
                        </span>
                    </div>
                    
                    <div className="glass px-5 py-3 rounded-2xl flex items-center gap-3 ring-1 ring-primary/10 shadow-sm">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Clock size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                            SYSTEM TIME: {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                        </span>
                    </div>

                    <div className="hidden lg:flex glass px-5 py-3 rounded-2xl items-center gap-3 ring-1 ring-primary/10 shadow-sm">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Sparkles size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                            STABLE v4.0.2
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Decorative background blur */}
            <div className="absolute top-[-50%] right-[10%] w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
        </div>
    );
};
