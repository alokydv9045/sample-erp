'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { examAPI } from '@/lib/api';
import apiClient from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditExamPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        examType: 'UNIT_TEST',
        classId: '',
        academicYearId: '',
        startDate: '',
        endDate: '',
    });

    const fetchData = useCallback(async () => {
        try {
            setIsFetching(true);
            const [classRes, ayRes, examRes] = await Promise.all([
                apiClient.get('/academic/classes'),
                apiClient.get('/academic/years'),
                examAPI.getById(params.id as string),
            ]);

            setClasses(classRes.data.classes || classRes.data || []);
            setAcademicYears(ayRes.data.academicYears || ayRes.data || []);

            const exam = examRes.exam;
            if (exam) {
                setFormData({
                    name: exam.name || '',
                    examType: exam.examType || 'UNIT_TEST',
                    classId: exam.classId || '',
                    academicYearId: exam.academicYearId || '',
                    startDate: exam.startDate ? new Date(exam.startDate).toISOString().split('T')[0] : '',
                    endDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
                });
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load exam data');
        } finally {
            setIsFetching(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) fetchData();
    }, [params.id, fetchData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.classId || !formData.academicYearId) {
            setError('Please select a class and academic year');
            return;
        }

        setIsLoading(true);
        try {
            await examAPI.update(params.id as string, formData);
            toast.success('Exam updated successfully');
            router.push(`/dashboard/exams/${params.id}`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update exam');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/exams/${params.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Exam Details
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Examination</CardTitle>
                    <CardDescription>Update exam details and schedule</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Exam Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g., Mid-Term Examination 2026"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="examType">Exam Type *</Label>
                                    <select
                                        id="examType"
                                        name="examType"
                                        value={formData.examType}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        disabled={isLoading}
                                    >
                                        <option value="UNIT_TEST">Unit Test</option>
                                        <option value="HALF_YEARLY">Half-Yearly Exam</option>
                                        <option value="ANNUAL">Annual Exam</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="classId">Class *</Label>
                                    <select
                                        id="classId"
                                        name="classId"
                                        value={formData.classId}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        required
                                        disabled={isLoading}
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="academicYearId">Academic Year *</Label>
                                    <select
                                        id="academicYearId"
                                        name="academicYearId"
                                        value={formData.academicYearId}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        required
                                        disabled={isLoading}
                                    >
                                        <option value="">Select Academic Year</option>
                                        {academicYears.map((ay: any) => (
                                            <option key={ay.id} value={ay.id}>{ay.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Schedule</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input
                                        id="endDate"
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Exam'
                                )}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/dashboard/exams/${params.id}`}>Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
