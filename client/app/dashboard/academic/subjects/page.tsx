"use client";

import { useState, useEffect, useCallback } from "react";
import { academicAPI, teacherAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ChevronLeft, Loader2, BookOpen, Users } from "lucide-react";
import { toast } from 'sonner';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);


    const [subjectForm, setSubjectForm] = useState({
        name: "",
        code: "",
        description: "",
        classId: "",
        type: "CORE", // Options: CORE, ELECTIVE, OPTIONAL, EXTRACURRICULAR
        teacherId: "",
    });

    const [assignForm, setAssignForm] = useState({
        teacherId: "",
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [subjectsRes, classesRes, teachersRes] = await Promise.all([
                academicAPI.getSubjects(),
                academicAPI.getClasses(),
                teacherAPI.getAll()
            ]);
            setSubjects(subjectsRes.subjects || []);
            setClasses(classesRes.classes || []);
            setTeachers(teachersRes.teachers || []);
        } catch (error) {
            console.error("Failed to fetch subjects data", error);
            toast.error('Failed to load subjects data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await academicAPI.createSubject(subjectForm);
            toast.success('Subject created successfully');
            setIsSubjectDialogOpen(false);
            setSubjectForm({ name: "", code: "", description: "", classId: "", type: "CORE", teacherId: "" });
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to create subject');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubjectId || !assignForm.teacherId) return;

        setIsSubmitting(true);
        try {
            await academicAPI.assignSubjectTeacher({
                subjectId: selectedSubjectId,
                teacherId: assignForm.teacherId
            });
            toast.success('Teacher assigned to subject successfully');
            setIsAssignDialogOpen(false);
            setAssignForm({ teacherId: "" });
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to assign teacher');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAssignDialog = (subjectId: string) => {
        setSelectedSubjectId(subjectId);
        setIsAssignDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/dashboard/academic">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Academics
                    </Link>
                </Button>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Subjects & Assignments</h1>
                        <p className="text-muted-foreground">Manage subjects and assign teachers.</p>
                    </div>

                    <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Subject</DialogTitle>
                                <DialogDescription>Create a new academic subject.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateSubject} className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subjectName">Subject Name *</Label>
                                        <Input
                                            id="subjectName"
                                            placeholder="e.g., Mathematics"
                                            required
                                            value={subjectForm.name}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subjectCode">Subject Code *</Label>
                                        <Input
                                            id="subjectCode"
                                            placeholder="e.g., MATH101"
                                            required
                                            value={subjectForm.code}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="classId">Class *</Label>
                                        <select
                                            id="classId"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            value={subjectForm.classId}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select Class</option>
                                            {classes.map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name} (Level {cls.numericValue})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subjectType">Type</Label>
                                        <select
                                            id="subjectType"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            value={subjectForm.type}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                                        >
                                            <option value="CORE">Core</option>
                                            <option value="ELECTIVE">Elective</option>
                                            <option value="OPTIONAL">Optional</option>
                                            <option value="EXTRACURRICULAR">Extracurricular</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="createSubjectTeacherId">Subject Teacher (Optional)</Label>
                                    <select
                                        id="createSubjectTeacherId"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={subjectForm.teacherId}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.user?.firstName} {t.user?.lastName} ({t.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="Brief description"
                                        value={subjectForm.description}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Subject"
                                    )}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Teacher</DialogTitle>
                        <DialogDescription>
                            Assign a teacher to this subject.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignTeacher} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="teacherId">Select Teacher *</Label>
                            <select
                                id="teacherId"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={assignForm.teacherId}
                                onChange={(e) => setAssignForm({ teacherId: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select Teacher</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.user?.firstName} {t.user?.lastName} ({t.employeeId})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                "Assign Teacher"
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>All Subjects</CardTitle>
                    <CardDescription>A complete list of subjects taught across all classes.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <BookOpen className="h-10 w-10 mb-4 opacity-50" />
                            <p>No subjects found. Create one to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subjects.map((subject) => (
                                        <TableRow key={subject.id}>
                                            <TableCell className="font-mono text-xs">{subject.code}</TableCell>
                                            <TableCell className="font-medium">{subject.name}</TableCell>
                                            <TableCell>{subject.class?.name || "N/A"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {subject.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {subject.teachers?.length > 0 ? (
                                                        subject.teachers.map((st: any) => (
                                                            <Badge key={st.id} variant="secondary" className="font-normal">
                                                                {st.teacher?.user?.firstName} {st.teacher?.user?.lastName}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">None assigned</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openAssignDialog(subject.id)}
                                                >
                                                    <Users className="mr-2 h-3.5 w-3.5" />
                                                    Assign
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
