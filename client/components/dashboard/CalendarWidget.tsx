"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Clock, 
    MapPin, 
    Plus,
    AlertCircle,
    Star,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calendarApi, CalendarEvent } from '@/lib/api/calendar';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from "@/components/ui/skeleton";

const GLASS_STYLE = "bg-card border shadow-sm hover:shadow-md transition-all duration-300";

const TYPE_CONFIG = {
    HOLIDAY: { color: 'bg-red-500', label: 'Holiday', icon: AlertCircle, theme: 'text-red-600 bg-red-50 border-red-100' },
    EVENT: { color: 'bg-blue-500', label: 'Event', icon: Star, theme: 'text-blue-600 bg-blue-50 border-blue-100' },
    EXAM: { color: 'bg-orange-500', label: 'Exam', icon: BookOpen, theme: 'text-orange-600 bg-orange-50 border-orange-100' },
    EMERGENCY: { color: 'bg-rose-600', label: 'Emergency', icon: AlertCircle, theme: 'text-rose-600 bg-rose-50 border-rose-100' },
    NOTICE: { color: 'bg-slate-500', label: 'Notice', icon: CalendarIcon, theme: 'text-slate-600 bg-slate-50 border-slate-100' }
};

export const CalendarWidget: React.FC = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
            const res = await calendarApi.getEvents(start, end);
            if (res.success) setEvents(res.events);
        } catch (err) {
            console.error('Failed to fetch calendar events', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getEventsForDay = (day: number) => {
        return events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === currentDate.getMonth() && 
                   eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const selectedDayEvents = getEventsForDay(selectedDate.getDate());

    return (
        <Card className={cn(GLASS_STYLE, "overflow-hidden flex flex-col h-full")}>
            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        School Calendar
                    </CardTitle>
                    <CardDescription>Academic schedule & events</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold min-w-[100px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4 p-4">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-[10px] font-bold text-muted-foreground uppercase py-1">
                            {day}
                        </div>
                    ))}
                    
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-10" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(day);
                        const isToday = new Date().getDate() === day && 
                                       new Date().getMonth() === currentDate.getMonth() && 
                                       new Date().getFullYear() === currentDate.getFullYear();
                        const isSelected = selectedDate.getDate() === day && 
                                          selectedDate.getMonth() === currentDate.getMonth() && 
                                          selectedDate.getFullYear() === currentDate.getFullYear();

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                className={cn(
                                    "h-10 rounded-lg flex flex-col items-center justify-center relative transition-all text-sm",
                                    isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted",
                                    isSelected && !isToday ? "border-2 border-primary" : "border border-transparent",
                                    dayEvents.some(e => !e.isWorkingDay) && !isToday && "text-red-500 font-semibold"
                                )}
                            >
                                {day}
                                <div className="flex gap-0.5 mt-0.5">
                                    {dayEvents.slice(0, 3).map((e, idx) => (
                                        <div 
                                            key={idx} 
                                            className={cn(
                                                "h-1 w-1 rounded-full",
                                                TYPE_CONFIG[e.type]?.color || 'bg-slate-400'
                                            )} 
                                        />
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Event Details Section */}
                <div className="mt-2 space-y-3 flex-1 overflow-y-auto max-h-[180px] custom-scrollbar">
                    <div className="flex items-center justify-between border-b pb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Events for {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        {isAdmin && (
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-primary">
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    ) : selectedDayEvents.length === 0 ? (
                        <div className="text-center py-6">
                            <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                            <p className="text-xs text-muted-foreground italic">No events scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {selectedDayEvents.map(event => {
                                const cfg = TYPE_CONFIG[event.type];
                                return (
                                    <div 
                                        key={event.id} 
                                        className={cn(
                                            "p-2.5 rounded-xl border flex items-start gap-3 transition-all hover:translate-x-1",
                                            cfg.theme
                                        )}
                                    >
                                        <div className="p-1.5 rounded-lg bg-white/50 shrink-0">
                                            <cfg.icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold truncate">{event.title}</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {event.startTime && (
                                                    <span className="flex items-center gap-1 text-[10px] opacity-70">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {event.location && (
                                                    <span className="flex items-center gap-1 text-[10px] opacity-70">
                                                        <MapPin className="h-3 w-3" />
                                                        {event.location}
                                                    </span>
                                                )}
                                                {!event.isWorkingDay && (
                                                    <Badge variant="outline" className="text-[9px] h-4 py-0 border-current bg-white/30">
                                                        School Holiday
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* View Full Calendar Button */}
                <Button variant="outline" className="w-full text-xs h-9 mt-auto border-dashed hover:border-solid hover:bg-primary/5 group" asChild>
                    <a href="/dashboard/calendar" className="flex items-center justify-center gap-2">
                        View Full Academic Schedule 
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
};
