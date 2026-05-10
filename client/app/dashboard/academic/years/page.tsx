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
import { Plus, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AcademicYearsPage() {
    const [years, setYears] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const [formData, setFormData] = useState({
        name: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
    });

    const fetchYears = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await academicAPI.getAcademicYears();
            setYears(response.years || []);
        } catch (error) {
            console.error("Failed to fetch academic years", error);
            toast.error('Failed to load academic years');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchYears();
    }, [fetchYears]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await academicAPI.createAcademicYear({
                ...formData,
                isCurrent: Boolean(formData.isCurrent),
            });
            toast.success('Academic year created successfully');
            setIsDialogOpen(false);
            setFormData({ name: "", startDate: "", endDate: "", isCurrent: false });
            fetchYears();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to create academic year');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetCurrent = async (id: string) => {
        try {
            await academicAPI.setCurrentAcademicYear(id);
            toast.success('Current academic year updated');
            fetchYears();
        } catch (error) {
            toast.error('Failed to update current academic year');
        }
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
                        <h1 className="text-3xl font-bold tracking-tight">Academic Years</h1>
                        <p className="text-muted-foreground">Manage school terms and academic years</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Academic Year
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Academic Year</DialogTitle>
                                <DialogDescription>Create a new academic period.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name (e.g., 2024-2025)</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            required
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            required
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isCurrent"
                                        checked={formData.isCurrent}
                                        onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="isCurrent" className="font-normal cursor-pointer">
                                        Set as current academic year
                                    </Label>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Create Academic Year"
                                    )}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Academic Years</CardTitle>
                    <CardDescription>A list of all past, present, and future academic years.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : years.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No academic years found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {years.map((year) => (
                                        <TableRow key={year.id}>
                                            <TableCell className="font-medium">{year.name}</TableCell>
                                            <TableCell>{format(new Date(year.startDate), "MMM d, yyyy")}</TableCell>
                                            <TableCell>{format(new Date(year.endDate), "MMM d, yyyy")}</TableCell>
                                            <TableCell>
                                                {year.isCurrent ? (
                                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                        Current
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!year.isCurrent && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSetCurrent(year.id)}
                                                    >
                                                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                                        Set Current
                                                    </Button>
                                                )}
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
