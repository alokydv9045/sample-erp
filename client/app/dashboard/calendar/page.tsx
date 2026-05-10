"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Plus,
    Filter,
    Download,
    Settings,
    MoreHorizontal,
    Search,
    MapPin,
    Clock,
    Users,
    AlertCircle,
    Star,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calendarApi, CalendarEvent } from '@/lib/api/calendar';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TYPE_CONFIG = {
    HOLIDAY: { color: 'bg-red-500', label: 'Holiday', icon: AlertCircle, theme: 'border-red-200 bg-red-50 text-red-700' },
    EVENT: { color: 'bg-blue-500', label: 'Event', icon: Star, theme: 'border-blue-200 bg-blue-50 text-blue-700' },
    EXAM: { color: 'bg-orange-500', label: 'Exam', icon: BookOpen, theme: 'border-orange-200 bg-orange-50 text-orange-700' },
    EMERGENCY: { color: 'bg-rose-600', label: 'Emergency', icon: AlertCircle, theme: 'border-rose-200 bg-rose-50 text-rose-700' },
    NOTICE: { color: 'bg-slate-500', label: 'Notice', icon: CalendarIcon, theme: 'border-slate-200 bg-slate-50 text-slate-700' }
};

export default function FullCalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PRINCIPAL';

    const [selectedFilters, setSelectedFilters] = useState<string[]>(['HOLIDAY', 'EVENT', 'EXAM', 'EMERGENCY', 'NOTICE']);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newEvent, setNewEvent] = useState<{
        title: string;
        description: string;
        date: string;
        type: CalendarEvent['type'];
        location: string;
        startTime: string;
        endTime: string;
        isPublic: boolean;
    }>({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'EVENT',
        location: '',
        startTime: '',
        endTime: '',
        isPublic: true
    });

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
            const res = await calendarApi.getEvents(start, end);
            if (res.success) setEvents(res.events);
        } catch (err) {
            console.error('Failed to fetch events', err);
            toast.error("Failed to load school calendar records");
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const res = await calendarApi.createEvent(newEvent);
            if (res.success) {
                toast.success("Institutional event established successfully");
                setIsAddModalOpen(false);
                fetchEvents();
                // Reset form
                setNewEvent({
                    title: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    type: 'EVENT',
                    location: '',
                    startTime: '',
                    endTime: '',
                    isPublic: true
                });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Internal server error during event creation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const exportCalendar = () => {
        const headers = ["Title", "Date", "Type", "Location", "Description"].join(",");
        const rows = filteredEvents.map(e => 
            `"${e.title}","${new Date(e.date).toLocaleDateString()}","${e.type}","${e.location || 'N/A'}","${e.description || 'N/A'}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `EduSphere_Calendar_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Calendar exported to localized ledger (CSV)");
    };

    const toggleFilter = (type: string) => {
        setSelectedFilters(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const filteredEvents = events.filter(e => selectedFilters.includes(e.type));

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ──── Header ──── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Academic Calendar
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Institutional schedule, public holidays, and event horizons.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select onValueChange={(val) => val === 'ALL' ? setSelectedFilters(Object.keys(TYPE_CONFIG)) : setSelectedFilters([val])}>
                        <SelectTrigger className="w-[140px] bg-white">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filters" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Categories</SelectItem>
                            {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                                <SelectItem key={key} value={key}>{val.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Button variant="outline" className="gap-2 bg-white" onClick={exportCalendar}>
                        <Download className="h-4 w-4" /> Export
                    </Button>

                    {isAdmin && (
                        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                                    <Plus className="h-4 w-4" /> Add Event
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 border-none shadow-2xl overflow-hidden">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-xl">
                                            <CalendarIcon className="h-6 w-6 text-primary" />
                                        </div>
                                        Define Milestone
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Broadcast an institutional event or holiday to the community.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddEvent} className="space-y-4 py-4">
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-400">Event Title</Label>
                                        <Input 
                                            id="title" 
                                            placeholder="e.g. Annual Sports Meet 2026" 
                                            value={newEvent.title}
                                            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                            required
                                            className="rounded-xl border-slate-200 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 text-left">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</Label>
                                            <Input 
                                                type="date" 
                                                value={newEvent.date}
                                                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                                required
                                                className="rounded-xl border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</Label>
                                            <Select value={newEvent.type} onValueChange={(v) => setNewEvent({...newEvent, type: v as CalendarEvent['type']})}>
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                                                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input 
                                                id="location" 
                                                placeholder="Auditorium, Main Field, etc." 
                                                className="pl-10 rounded-xl border-slate-200"
                                                value={newEvent.location}
                                                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Description</Label>
                                        <Textarea 
                                            placeholder="Provide context for the student community..." 
                                            className="rounded-xl border-slate-200 min-h-[80px]"
                                            value={newEvent.description}
                                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                        />
                                    </div>
                                    <DialogFooter className="pt-4">
                                        <Button 
                                            type="submit" 
                                            className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/30"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Establishing..." : "Propagate Event"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* ──── Controls ──── */}
            <Card className="border-none bg-slate-50 shadow-inner">
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
                        <h2 className="text-xl font-extrabold min-w-[200px] text-center">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
                        <Button variant="link" onClick={() => setCurrentDate(new Date())} className="text-primary font-bold">Today</Button>
                    </div>
                    <div className="flex bg-white rounded-xl p-1 border shadow-sm">
                        <Button 
                            variant={viewMode === 'month' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('month')}
                            className="rounded-lg px-4"
                        >
                            Month
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('list')}
                            className="rounded-lg px-4"
                        >
                            List
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* ──── Main Calendar Grid ──── */}
                <Card className="xl:col-span-3 border shadow-xl overflow-hidden rounded-3xl">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 border-b bg-slate-50/50">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <div key={day} className="py-4 text-center text-[10px] font-black tracking-widest text-slate-400">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y border-l border-t">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-slate-50/30 p-2" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const isToday = new Date().getDate() === day && 
                                               new Date().getMonth() === currentDate.getMonth() && 
                                               new Date().getFullYear() === currentDate.getFullYear();
                                
                                const dayEvents = filteredEvents.filter(e => new Date(e.date).getDate() === day);

                                return (
                                    <div key={day} className={cn(
                                        "p-2 group transition-colors hover:bg-slate-50 flex flex-col gap-1 relative",
                                        isToday && "bg-primary/5 ring-1 ring-inset ring-primary/20"
                                    )}>
                                        <div className="flex justify-between items-center px-1">
                                            <span className={cn(
                                                "text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full transition-all",
                                                isToday ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-600 group-hover:text-primary"
                                            )}>
                                                {day}
                                            </span>
                                            {dayEvents.length > 0 && <span className="text-[10px] font-bold text-slate-400">{dayEvents.length} items</span>}
                                        </div>
                                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar px-1">
                                            {dayEvents.map(event => (
                                                <div 
                                                    key={event.id}
                                                    className={cn(
                                                        "px-2 py-1 rounded-md text-[10px] font-bold shadow-sm border truncate leading-tight",
                                                        TYPE_CONFIG[event.type]?.theme || 'bg-white'
                                                    )}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* ──── Sidebar: Event Ledger ──── */}
                <div className="space-y-6">
                    <Card className="rounded-3xl border-none bg-slate-900 text-white shadow-2xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Event Horizons</CardTitle>
                            <CardDescription className="text-slate-400">Chronological list of milestones</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-800" />)
                            ) : filteredEvents.length === 0 ? (
                                <div className="text-center py-12 opacity-40">
                                    <CalendarIcon className="h-10 w-10 mx-auto mb-2" />
                                    <p className="text-sm italic">No records in ledger</p>
                                </div>
                            ) : (
                                filteredEvents.slice(0, 10).map(event => {
                                    const cfg = TYPE_CONFIG[event.type];
                                    return (
                                        <div key={event.id} className="relative pl-6 border-l-2 border-slate-700 pb-4 last:pb-0 group">
                                            <div className={cn(
                                                "absolute -left-[5px] top-0 h-2 w-2 rounded-full ring-4 ring-slate-900",
                                                cfg.color
                                            )} />
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400 h-4">{cfg.label}</Badge>
                                                </div>
                                                <h4 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer">{event.title}</h4>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                    {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
                                                    {event.startTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Legend */}
                    <Card className="rounded-3xl border-slate-100 shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-50 py-4">
                            <CardTitle className="text-xs font-black tracking-widest text-slate-400 uppercase">Institutional Legend</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <div className={cn("h-3 w-3 rounded-full", val.color)} />
                                    <span className="text-xs font-bold text-slate-600">{val.label}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
