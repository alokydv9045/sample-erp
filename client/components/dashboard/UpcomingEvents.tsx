"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    CalendarDays, 
    Clock, 
    MapPin, 
    ChevronRight,
    AlertCircle,
    Star,
    BookOpen,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calendarApi, CalendarEvent } from '@/lib/api/calendar';
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';

const TYPE_CONFIG: Record<string, { color: string; icon: any; theme: string }> = {
    HOLIDAY: { color: 'bg-red-500', icon: AlertCircle, theme: 'text-red-600 bg-red-50 border-red-100' },
    EVENT: { color: 'bg-blue-500', icon: Star, theme: 'text-blue-600 bg-blue-50 border-blue-100' },
    EXAM: { color: 'bg-orange-500', icon: BookOpen, theme: 'text-orange-600 bg-orange-50 border-orange-100' },
    EMERGENCY: { color: 'bg-rose-600', icon: AlertCircle, theme: 'text-rose-600 bg-rose-50 border-rose-100' },
    NOTICE: { color: 'bg-slate-500', icon: Info, theme: 'text-slate-600 bg-slate-50 border-slate-100' }
};

export function UpcomingEvents() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpcoming = async () => {
            try {
                setLoading(true);
                const res = await calendarApi.getUpcomingEvents(6);
                if (res.success) {
                    setEvents(res.events);
                }
            } catch (err) {
                console.error('Failed to fetch upcoming events', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUpcoming();
    }, []);

    return (
        <Card className="h-full flex flex-col shadow-2xl border-none bg-slate-950 text-slate-50 overflow-hidden min-h-[450px]">
            <CardHeader className="pb-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            Upcoming Events
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-400">School activities & schedule</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-hidden bg-slate-950">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg shrink-0 bg-white/5" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4 bg-white/5" />
                                    <Skeleton className="h-3 w-1/2 bg-white/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="p-3 bg-white/5 rounded-full mb-3">
                            <CalendarDays className="h-8 w-8 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No upcoming events scheduled</p>
                    </div>
                ) : (
                    <div className="space-y-3 h-full overflow-y-auto pr-1 custom-scrollbar">
                        {events.map((event) => {
                            const date = new Date(event.date);
                            const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.NOTICE;

                            return (
                                <div 
                                    key={event.id}
                                    className="group relative flex gap-3 p-2 rounded-xl transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
                                >
                                    <div className={cn(
                                        "flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 border border-white/10 bg-white/5 shadow-inner"
                                    )}>
                                        <span className="text-[10px] font-bold uppercase text-slate-400">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-lg font-black leading-none text-white">{date.getDate()}</span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold truncate text-slate-100 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h4>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                            {event.startTime && (
                                                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                                    <Clock className="h-3 w-3 text-primary/70" />
                                                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {event.location && (
                                                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                                    <MapPin className="h-3 w-3 text-primary/70" />
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
            <div className="p-3 border-t border-white/10 bg-white/5 mt-auto">
                <Link href="/dashboard/calendar" className="w-full text-center">
                    <button className="w-full text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1">
                        View Full Schedule <ChevronRight className="h-3 w-3" />
                    </button>
                </Link>
            </div>
        </Card>
    );
}
