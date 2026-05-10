'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, Clock, Coffee, Calendar } from 'lucide-react';
import { timetableAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TimetableWizardProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    academicYearId: string;
    onSuccess: () => void;
}

const TimetableWizard: React.FC<TimetableWizardProps> = ({ isOpen, onClose, classId, academicYearId, onSuccess }) => {
    const [config, setConfig] = useState({
        startTime: '08:00',
        endTime: '14:30',
        periodDuration: 40,
        lunchStartTime: '12:00',
        lunchDuration: 30,
        shortBreakTime: '10:30',
        shortBreakDuration: 15,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const timeToMins = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- Validation Logic ---
        const start = timeToMins(config.startTime);
        const end = timeToMins(config.endTime);
        const lunch = timeToMins(config.lunchStartTime);

        if (start >= end) {
            toast({ title: "Invalid Hours", description: "School start time must be before end time.", variant: "destructive" });
            return;
        }

        if (lunch < start || lunch >= end) {
            toast({ title: "Invalid Lunch", description: "Lunch must be during school hours.", variant: "destructive" });
            return;
        }

        if (config.periodDuration < 5 || config.periodDuration > 120) {
            toast({ title: "Invalid Duration", description: "Period duration should be between 5 and 120 mins.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Save Config
            await timetableAPI.updateConfig(classId, { ...config, academicYearId });
            
            toast({
                title: "Configuration Saved",
                description: "Generating your timetable skeleton...",
            });
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.error || "Failed to configure timetable",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        Timetable Setup Wizard
                    </DialogTitle>
                    <DialogDescription>
                        Define the daily routine for this class. This will generate a baseline skeleton for all sections.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        {/* School Hours */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold border-b pb-2">
                                <Clock className="h-4 w-4" />
                                Working Hours
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startTime">School Start Time</Label>
                                <Input 
                                    id="startTime" 
                                    type="time" 
                                    value={config.startTime} 
                                    onChange={e => setConfig({...config, startTime: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">School End Time</Label>
                                <Input 
                                    id="endTime" 
                                    type="time" 
                                    value={config.endTime} 
                                    onChange={e => setConfig({...config, endTime: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Standard Period (mins)</Label>
                                <Input 
                                    id="duration" 
                                    type="number" 
                                    value={config.periodDuration} 
                                    onChange={e => setConfig({...config, periodDuration: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>

                        {/* Breaks */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold border-b pb-2">
                                <Coffee className="h-4 w-4" />
                                Lunch & Breaks
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lunchStart">Lunch Start Time</Label>
                                <Input 
                                    id="lunchStart" 
                                    type="time" 
                                    value={config.lunchStartTime} 
                                    onChange={e => setConfig({...config, lunchStartTime: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lunchDuration">Lunch Duration (mins)</Label>
                                <Input 
                                    id="lunchDuration" 
                                    type="number" 
                                    value={config.lunchDuration} 
                                    onChange={e => setConfig({...config, lunchDuration: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="breakStart">Short Break Time</Label>
                                <Input 
                                    id="breakStart" 
                                    type="time" 
                                    value={config.shortBreakTime} 
                                    onChange={e => setConfig({...config, shortBreakTime: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            <strong>Note:</strong> Generating a new baseline will <strong>remove all existing assignments</strong> for this class's current timetable. Please use with caution.
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Generate Timetable Skeleton"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default TimetableWizard;
