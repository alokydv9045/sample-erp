"use client";

import { useState, useEffect, useCallback } from "react";
import { academicAPI } from "@/lib/api";
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
import { Plus, ChevronLeft, Loader2, Users } from "lucide-react";
import { toast } from 'sonner';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const [classForm, setClassForm] = useState({
        name: "",
        numericValue: "",
        description: "",
        academicYearId: "",
    });

    const [sectionForm, setSectionForm] = useState({
        name: "",
        capacity: "40",
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [classesResponse, yearsResponse] = await Promise.all([
                academicAPI.getClasses(),
                academicAPI.getAcademicYears()
            ]);
            setClasses(classesResponse.classes || []);
            setAcademicYears(yearsResponse.years || []);

            // Select current year by default if one exists
            const currentYear = yearsResponse.years?.find((y: any) => y.isCurrent);
            if (currentYear && !classForm.academicYearId) {
                setClassForm(prev => ({ ...prev, academicYearId: currentYear.id }));
            }
        } catch (error) {
            console.error("Failed to fetch classes data", error);
            toast.error('Failed to load classes data');
        } finally {
            setIsLoading(false);
        }
    }, [classForm.academicYearId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await academicAPI.createClass(classForm);
            toast.success('Class created successfully');
            setIsClassDialogOpen(false);
            setClassForm({ ...classForm, name: "", numericValue: "", description: "" });
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to create class');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId) return;

        setIsSubmitting(true);
        try {
            await academicAPI.createSection({
                name: sectionForm.name,
                maxStudents: sectionForm.capacity,
                classId: selectedClassId
            });
            toast.success('Section added successfully');
            setIsSectionDialogOpen(false);
            setSectionForm({ name: "", capacity: "40" });
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to add section');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openSectionDialog = (classId: string) => {
        setSelectedClassId(classId);
        setIsSectionDialogOpen(true);
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
                        <h1 className="text-3xl font-bold tracking-tight">Classes & Sections</h1>
                        <p className="text-muted-foreground">Manage grade levels and their divisions.</p>
                    </div>

                    <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Class
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Class</DialogTitle>
                                <DialogDescription>Create a new grade level.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="academicYearId">Academic Year *</Label>
                                    <select
                                        id="academicYearId"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={classForm.academicYearId}
                                        onChange={(e) => setClassForm({ ...classForm, academicYearId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Academic Year</option>
                                        {academicYears.map((year) => (
                                            <option key={year.id} value={year.id}>
                                                {year.name} {year.isCurrent ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="className">Class Name *</Label>
                                        <Input
                                            id="className"
                                            placeholder="e.g., Grade 10"
                                            required
                                            value={classForm.name}
                                            onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="numericValue">Numeric Level *</Label>
                                        <Input
                                            id="numericValue"
                                            type="number"
                                            placeholder="e.g., 10"
                                            required
                                            value={classForm.numericValue}
                                            onChange={(e) => setClassForm({ ...classForm, numericValue: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="Brief description"
                                        value={classForm.description}
                                        onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Class"
                                    )}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Section</DialogTitle>
                        <DialogDescription>
                            Add a new division (e.g., A, B, C) to the selected class.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSection} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sectionName">Section Name *</Label>
                                <Input
                                    id="sectionName"
                                    placeholder="e.g., A"
                                    required
                                    value={sectionForm.name}
                                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Max Capacity *</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    placeholder="e.g., 40"
                                    required
                                    value={sectionForm.capacity}
                                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Section"
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : classes.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="rounded-full bg-primary/10 p-3 mb-4">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium">No Classes Found</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Get started by creating your first class.
                            </p>
                            <Button onClick={() => setIsClassDialogOpen(true)}>
                                Add Class
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {classes.map((cls) => (
                            <Card key={cls.id} className="flex flex-col">
                                <CardHeader className="pb-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-xl">{cls.name}</CardTitle>
                                            <CardDescription>
                                                {cls.academicYear?.name} • Level {cls.numericValue}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-4">
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Sections</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {cls.sections?.length > 0 ? (
                                                    cls.sections.map((section: any) => (
                                                        <Badge key={section.id} variant="secondary">
                                                            Section {section.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">No sections added yet</span>
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className="cursor-pointer border-dashed border-primary/50 text-primary/70 hover:bg-primary/5 hover:text-primary transition-colors"
                                                    onClick={() => openSectionDialog(cls.id)}
                                                >
                                                    <Plus className="mr-1 h-3 w-3" />
                                                    Add
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">Students</span>
                                                <span className="font-medium text-sm">{cls._count?.students || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">Class Teacher</span>
                                                <span className="font-medium text-sm truncate">
                                                    {cls.classTeacher
                                                        ? `${cls.classTeacher.user.firstName} ${cls.classTeacher.user.lastName}`
                                                        : "Not Assigned"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
