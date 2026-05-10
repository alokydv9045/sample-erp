'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, GraduationCap } from 'lucide-react';

interface TimetableSlot {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    period: number;
    subject?: { name: string };
    teacher?: { user: { firstName: string; lastName: string } };
    section?: { name: string; class: { name: string } };
    room?: { name: string };
    isSpecialSlot: boolean;
    specialSlotName?: string;
}

interface TimetableGridProps {
    schedule: TimetableSlot[];
    viewType: 'teacher' | 'student' | 'admin';
    onSlotClick?: (slot: TimetableSlot) => void;
}

const TimetableGrid: React.FC<TimetableGridProps> = ({ schedule, viewType, onSlotClick }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Group slots by day
    const getSlotsForDay = (dayIndex: number) => {
        return schedule
            .filter(slot => slot.dayOfWeek === dayIndex + 1)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    if (schedule.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No Schedule Published</h3>
                <p className="text-sm text-muted-foreground">The timetable has not been assigned or published yet.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {days.map((day, index) => {
                const daySlots = getSlotsForDay(index);
                if (daySlots.length === 0) return null;

                return (
                    <Card key={day} className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
                        <CardHeader className="bg-primary/5 py-3 border-b">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                                {day}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {daySlots.map((slot) => (
                                    <div 
                                        key={slot.id} 
                                        onClick={() => onSlotClick?.(slot)}
                                        className={`p-4 transition-all relative group border-l-4 ${
                                            slot.isSpecialSlot 
                                                ? 'bg-amber-50/40 border-amber-400/50 hover:bg-amber-100/50' 
                                                : slot.subject 
                                                    ? 'bg-white border-primary/40 hover:bg-slate-50' 
                                                    : 'bg-slate-50/30 border-slate-200 hover:bg-slate-50'
                                        } ${onSlotClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className={`text-[10px] h-5 font-bold ${
                                                slot.isSpecialSlot 
                                                    ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                                    : slot.subject
                                                        ? 'bg-primary/5 text-primary border-primary/20'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                {slot.isSpecialSlot ? (slot.specialSlotName?.toUpperCase() || 'BREAK') : `PERIOD ${slot.period}`}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground flex items-center bg-white/50 px-1.5 py-0.5 rounded border">
                                                <Clock className="h-3 w-3 mr-1 text-primary" />
                                                {slot.startTime} - {slot.endTime}
                                            </span>
                                        </div>

                                        <h4 className={`font-bold text-sm leading-tight mb-1 ${
                                            slot.isSpecialSlot 
                                                ? 'text-amber-900' 
                                                : !slot.subject 
                                                    ? 'text-slate-400 italic' 
                                                    : 'text-slate-900'
                                        }`}>
                                            {slot.isSpecialSlot 
                                                ? slot.specialSlotName 
                                                : (slot.subject?.name || (viewType === 'admin' ? 'Assign Subject' : 'Unassigned'))}
                                        </h4>

                                        {!slot.isSpecialSlot && (
                                            <div className="space-y-1 mt-2">
                                                {viewType === 'admin' ? (
                                                    <>
                                                        <div className="flex items-center text-[10px] text-muted-foreground/70">
                                                            <User className="h-2.5 w-2.5 mr-1" />
                                                            {slot.teacher ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName.charAt(0)}.` : 'No Teacher'}
                                                        </div>
                                                        {slot.room && (
                                                            <div className="flex items-center text-[10px] text-muted-foreground/70">
                                                                <MapPin className="h-2.5 w-2.5 mr-1" />
                                                                {slot.room.name}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : viewType === 'teacher' ? (
                                                    <div className="flex items-center text-[11px] text-muted-foreground">
                                                        <GraduationCap className="h-3 w-3 mr-1.5 shrink-0" />
                                                        <span className="truncate">{slot.section?.class?.name} - {slot.section?.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-[11px] text-muted-foreground">
                                                        <User className="h-3 w-3 mr-1.5 shrink-0" />
                                                        <span className="truncate">{slot.teacher?.user?.firstName} {slot.teacher?.user?.lastName}</span>
                                                    </div>
                                                )}
                                                
                                                {viewType !== 'admin' && slot.room && (
                                                    <div className="flex items-center text-[11px] text-muted-foreground">
                                                        <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
                                                        <span className="truncate">Room {slot.room.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default TimetableGrid;
