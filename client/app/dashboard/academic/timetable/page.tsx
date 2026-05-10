'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Calendar, Settings, Wand2, ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';
import { academicAPI, timetableAPI } from '@/lib/api';
import TimetableGrid from '@/components/academic/TimetableGrid';
import TimetableWizard from '@/components/academic/TimetableWizard';
import SlotEditDialog from '@/components/academic/SlotEditDialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function TimetableManagementPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [timetable, setTimetable] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    
    // UI Modals
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<any>(null);
    const { toast } = useToast();

    const fetchDropdowns = useCallback(async () => {
        try {
            setIsLoadingClasses(true);
            const res = await academicAPI.getClasses();
            setClasses(res.classes || []);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        } finally {
            setIsLoadingClasses(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    const fetchTimetable = async (sectionId: string) => {
        if (!sectionId) return;
        try {
            setIsLoading(true);
            const res = await timetableAPI.getStudentSchedule(sectionId);
            setTimetable(res.schedule || []);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        const selectedClass = classes.find(c => c.id === classId);
        setSections(selectedClass?.sections || []);
        setSelectedSectionId('');
        setTimetable([]);
    };

    const handleSectionChange = (sectionId: string) => {
        setSelectedSectionId(sectionId);
        fetchTimetable(sectionId);
    };

    const handleSlotClick = (slot: any) => {
        if (slot.isSpecialSlot) {
            toast({
                title: "Special Slot",
                description: "Breaks and lunch slots are managed via the Configuration Wizard.",
            });
            return;
        }
        setActiveSlot(slot);
        setIsEditorOpen(true);
    };

    const handleGenerateBaseline = async () => {
        if (!selectedClassId || !selectedSectionId) return;
        
        // Find existing timetable ID from slots - if any
        const timetableId = timetable[0]?.timetableId || null;

        try {
            setIsLoading(true);
            // First get or create config for wizard modal if not exists
            const configRes = await timetableAPI.getConfig(selectedClassId);
            const configId = configRes.config?.id;
            if (!configId) {
                toast({ title: "Config Missing", description: "School timings are not configured for this class yet.", variant: "destructive" });
                return;
            }
            
            await timetableAPI.generateBaseline(timetableId, configId, selectedClassId);
            toast({
                title: "Timetable Reset",
                description: "Baseline skeleton generated successfully.",
            });
            fetchTimetable(selectedSectionId);
        } catch (error: any) {
            const errMsg = error?.response?.data?.message ||
                (typeof error?.response?.data?.error === 'string' ? error?.response?.data?.error : null) ||
                error?.message ||
                "Failed to generate baseline.";
            toast({
                title: "Generation Failed",
                description: errMsg,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Timetable Management</h1>
                    <p className="text-muted-foreground mt-1">Design and optimize class schedules with conflict detection.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsWizardOpen(true)} disabled={!selectedClassId}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Routine Wizard
                    </Button>
                    <Button onClick={handleGenerateBaseline} disabled={!selectedSectionId || isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
                        Generate Baseline
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                {/* Selector Panel */}
                <Card className="md:col-span-1 shadow-md border-none">
                    <CardHeader className="bg-primary/5 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {isLoadingClasses ? (
                            <div className="space-y-4">
                                <div className="h-10 w-full bg-slate-100 animate-pulse rounded" />
                                <div className="h-10 w-full bg-slate-100 animate-pulse rounded" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Class / Grade</label>
                                    <Select value={selectedClassId} onValueChange={handleClassChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Grade Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Section</label>
                                    <Select value={selectedSectionId} onValueChange={handleSectionChange} disabled={!selectedClassId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Division" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map((sec) => (
                                                <SelectItem key={sec.id} value={sec.id}>
                                                    Section {sec.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div className="pt-4 mt-4 border-t space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={timetable.length > 0 ? "outline" : "secondary"}>
                                    {timetable.length > 0 ? 'CONFIGURED' : 'UNASSIGNED'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Active Periods</span>
                                <span className="font-bold">{timetable.filter(s => !s.isSpecialSlot).length} / Week</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Editor View */}
                <Card className="md:col-span-3 shadow-md border-none min-h-[400px]">
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {selectedSectionId ? `Timetable Editor - ${classes.find(c => c.id === selectedClassId)?.name} (${sections.find(s => s.id === selectedSectionId)?.name})` : 'Schedule Visualization'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {!selectedSectionId ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                                <ArrowRight className="h-16 w-16 mb-4 animate-pulse mr-8" />
                                <h3 className="text-xl font-bold">Select a Class & Section</h3>
                                <p className="text-sm max-w-xs mt-2">Choose a grade level from the selection panel to begin designing the timetable.</p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                <p className="text-sm font-medium">Synchronizing Schedule Data...</p>
                            </div>
                        ) : timetable.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <Plus className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold italic">Schedule is Empty</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-8">
                                    No baseline skeleton exists for this section. Use the Routine Wizard or Generate Baseline to get started.
                                </p>
                                <Button onClick={() => setIsWizardOpen(true)}>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Launch Wizard
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto pb-4">
                                <TimetableGrid 
                                    schedule={timetable} 
                                    viewType="admin" 
                                    onSlotClick={handleSlotClick}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <TimetableWizard 
                isOpen={isWizardOpen} 
                onClose={() => setIsWizardOpen(false)}
                classId={selectedClassId}
                academicYearId={classes.find(c => c.id === selectedClassId)?.academicYearId || ''}
                onSuccess={() => {
                    setIsWizardOpen(false);
                    // Generate baseline after wizard success
                    handleGenerateBaseline();
                }}
            />

            <SlotEditDialog 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                slot={activeSlot}
                classId={selectedClassId}
                onSuccess={() => fetchTimetable(selectedSectionId)}
            />
        </div>
    );
}
