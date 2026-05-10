'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { termAPI, academicAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePermissions } from '@/hooks/usePermissions';

export default function TermsPage() {
    const { isAdmin } = usePermissions();
    const [terms, setTerms] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        termType: 'QUARTERLY',
        academicYearId: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [termsRes, yearsRes] = await Promise.all([
                termAPI.getAll(),
                academicAPI.getAcademicYears(),
            ]);
            setTerms(termsRes.terms || []);
            setAcademicYears(yearsRes.academicYears || []);

            const currentYear = yearsRes.academicYears?.find((y: any) => y.isCurrent);
            if (currentYear) {
                setFormData(prev => ({ ...prev, academicYearId: currentYear.id }));
            }
        } catch (err: any) {
            setError('Failed to fetch terms data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (term: any = null) => {
        if (term) {
            setEditingId(term.id);
            setFormData({
                name: term.name,
                termType: term.termType,
                academicYearId: term.academicYearId,
                startDate: term.startDate ? term.startDate.split('T')[0] : '',
                endDate: term.endDate ? term.endDate.split('T')[0] : '',
            });
        } else {
            setEditingId(null);
            // Keep academicYearId if already set
            setFormData(prev => ({
                ...prev,
                name: '',
                termType: 'QUARTERLY',
                startDate: '',
                endDate: '',
            }));
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            if (editingId) {
                await termAPI.update(editingId, formData);
            } else {
                await termAPI.create(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this term? This will fail if exams are linked to it.')) return;
        try {
            await termAPI.delete(id);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Delete failed');
        }
    };

    if (!isAdmin) return <div className="p-10 text-center">Unauthorized</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/exams">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Exams
                    </Link>
                </Button>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Term
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Academic Terms</CardTitle>
                    <CardDescription>Define terms (Unit Test, Half-Yearly, etc.) for each academic year.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                    ) : terms.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">No terms defined yet.</div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Term Name</TableHead>
                                        <TableHead>Academic Year</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {terms.map((term) => (
                                        <TableRow key={term.id}>
                                            <TableCell className="font-medium">{term.name}</TableCell>
                                            <TableCell>{term.academicYear?.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{term.termType}</Badge>
                                            </TableCell>
                                            <TableCell>{term.startDate ? new Date(term.startDate).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>{term.endDate ? new Date(term.endDate).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(term)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(term.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Simple Modal Implementation */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background w-full max-w-md rounded-lg shadow-lg border">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Term' : 'Add New Term'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{typeof error === "string" ? error : JSON.stringify(error)}</div>}

                            <div className="space-y-2">
                                <Label>Term Name *</Label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., First Unit Test"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select value={formData.termType} onValueChange={(v) => setFormData({ ...formData, termType: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNIT_TEST">Unit Test</SelectItem>
                                        <SelectItem value="HALF_YEARLY">Half-Yearly</SelectItem>
                                        <SelectItem value="ANNUAL">Annual</SelectItem>
                                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                        <SelectItem value="MONTHLY_TEST">Monthly Test</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Academic Year *</Label>
                                <Select value={formData.academicYearId} onValueChange={(v) => setFormData({ ...formData, academicYearId: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map(year => (
                                            <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {editingId ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
