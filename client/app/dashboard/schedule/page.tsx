'use client';

import { useEffect, useState } from 'react';
import { timetableAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import TimetableGrid from '@/components/academic/TimetableGrid';

export default function MySchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setIsLoading(true);
            setError('');
            // Standalone schedule page typically uses the logged-in user's teacher ID.
            // For now, we'll assume the API handle's authorization and returns the current teacher's schedule.
            // If the teacher's ID is needed specifically, it would come from the auth context.
            // Assuming the existing teacherAPI.getMySchedule() was the pattern.
            const res = await timetableAPI.getTeacherSchedule('me'); 
            setSchedule(res.schedule || []);
        } catch (err: any) {
            console.error('Failed to fetch schedule:', err);
            setError('Unable to load schedule. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">My Schedule</h1>
                    <p className="text-muted-foreground mt-1">View your weekly teaching schedule and class load.</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="py-8 text-center">
                        <p className="text-destructive font-medium">{typeof error === "string" ? error : JSON.stringify(error)}</p>
                    </CardContent>
                </Card>
            ) : schedule.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-xl font-bold">No Classes Assigned</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            The academic department hasn't assigned periods to your timetable yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <TimetableGrid schedule={schedule} viewType="teacher" />
            )}
        </div>
    );
}
