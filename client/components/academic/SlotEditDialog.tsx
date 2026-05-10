'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, User, BookOpen, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { timetableAPI, academicAPI, teacherAPI } from '@/lib/api';
import { toast } from 'sonner';

interface SlotEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    slot: any;
    classId: string;
    onSuccess: () => void;
}

const SlotEditDialog: React.FC<SlotEditDialogProps> = ({ isOpen, onClose, slot, classId, onSuccess }) => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selection, setSelection] = useState({
        subjectId: '',
        teacherId: '',
        roomId: '',
    });

    useEffect(() => {
        if (isOpen && classId) {
            fetchOptions();
            if (slot) {
                setSelection({
                    subjectId: slot.subjectId || '',
                    teacherId: slot.teacherId || '',
                    roomId: slot.roomId || '',
                });
            }
        }
    }, [isOpen, classId, slot]);

    const fetchOptions = async () => {
        setIsLoading(true);
        try {
            const [subjRes, teacherRes, roomRes] = await Promise.all([
                academicAPI.getSubjects({ classId }),
                teacherAPI.getAll(),
                timetableAPI.getRooms()
            ]);
            setSubjects(subjRes.subjects || []);
            setTeachers(teacherRes.teachers || []);
            setRooms(roomRes.rooms || []);
        } catch (error) {
            console.error('Failed to fetch assignment options:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await timetableAPI.updateSlot(slot.id, selection);
            toast.success("Slot Updated", {
                description: `Assigned ${subjects.find(s => s.id === selection.subjectId)?.name} for this period.`,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error("Conflict Detected", {
                description: error?.response?.data?.error || "This assignment conflicts with an existing schedule.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Assign Period
                    </DialogTitle>
                    <DialogDescription>
                        Assign a subject, teacher, and room for Period {slot?.period} on {slot?.dayOfWeek === 1 ? 'Monday' : slot?.dayOfWeek === 2 ? 'Tuesday' : slot?.dayOfWeek === 3 ? 'Wednesday' : slot?.dayOfWeek === 4 ? 'Thursday' : slot?.dayOfWeek === 5 ? 'Friday' : 'Saturday'}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        {/* Subject */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Subject
                            </Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selection.subjectId}
                                onChange={e => setSelection({...selection, subjectId: e.target.value})}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Teacher */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Teacher
                            </Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selection.teacherId}
                                onChange={e => setSelection({...selection, teacherId: e.target.value})}
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Room */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Room / Laboratory
                            </Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selection.roomId}
                                onChange={e => setSelection({...selection, roomId: e.target.value})}
                            >
                                <option value="">Select Room</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || !selection.subjectId || !selection.teacherId}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Assignment"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SlotEditDialog;
