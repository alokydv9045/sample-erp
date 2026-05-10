'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { gradeScaleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePermissions } from '@/hooks/usePermissions';

interface GradeEntry {
    grade: string;
    minPercent: number;
    maxPercent: number;
    order: number;
}

export default function GradingScalesPage() {
    const { isAdmin } = usePermissions();
    const [scales, setScales] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'PERCENTAGE',
        description: '',
        isDefault: false,
    });
    const [entries, setEntries] = useState<GradeEntry[]>([]);

    useEffect(() => {
        fetchScales();
    }, []);

    const fetchScales = async () => {
        try {
            setIsLoading(true);
            const res = await gradeScaleAPI.getAll();
            setScales(res.scales || []);
        } catch (err: any) {
            setError('Failed to fetch grading scales');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (scale: any = null) => {
        if (scale) {
            setEditingId(scale.id);
            setFormData({
                name: scale.name,
                type: scale.type,
                description: scale.description || '',
                isDefault: scale.isDefault || false,
            });
            setEntries(scale.entries?.map((e: any) => ({
                grade: e.grade,
                minPercent: e.minPercent,
                maxPercent: e.maxPercent,
                order: e.order,
            })) || []);
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                type: 'PERCENTAGE',
                description: '',
                isDefault: false,
            });
            // Initial default entries
            setEntries([
                { grade: 'A+', minPercent: 90, maxPercent: 100, order: 1 },
                { grade: 'A', minPercent: 80, maxPercent: 89, order: 2 },
                { grade: 'B', minPercent: 70, maxPercent: 79, order: 3 },
                { grade: 'C', minPercent: 60, maxPercent: 69, order: 4 },
                { grade: 'D', minPercent: 40, maxPercent: 59, order: 5 },
                { grade: 'F', minPercent: 0, maxPercent: 39, order: 6 },
            ]);
        }
        setIsModalOpen(true);
    };

    const addEntry = () => {
        setEntries([...entries, { grade: '', minPercent: 0, maxPercent: 0, order: entries.length + 1 }]);
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: string, value: any) => {
        const updated = [...entries];
        const item = { ...updated[index] };
        if (field === 'minPercent' || field === 'maxPercent' || field === 'order') {
            (item as any)[field] = parseFloat(value) || 0;
        } else {
            (item as any)[field] = value;
        }
        updated[index] = item;
        setEntries(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (entries.length === 0) {
            setError('Please add at least one grade entry.');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const payload = {
                name: formData.name,
                scaleType: formData.type,
                description: formData.description,
                isDefault: formData.isDefault,
                entries
            };
            if (editingId) {
                await gradeScaleAPI.update(editingId, payload);
            } else {
                await gradeScaleAPI.create(payload);
            }
            setIsModalOpen(false);
            fetchScales();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this scale? This will fail if exams are linked to it.')) return;
        try {
            await gradeScaleAPI.delete(id);
            fetchScales();
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
                    Add Grading Scale
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {isLoading ? (
                    <div className="col-span-2 flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : scales.length === 0 ? (
                    <div className="col-span-2 text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">No scales defined yet.</div>
                ) : (
                    scales.map((scale) => (
                        <Card key={scale.id}>
                            <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4 space-y-0">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {scale.name}
                                        {scale.isDefault && <Badge className="bg-green-100 text-green-700">Default</Badge>}
                                    </CardTitle>
                                    <CardDescription>{scale.description || 'No description'}</CardDescription>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(scale)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(scale.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Grade</TableHead>
                                                <TableHead>Range (%)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {scale.entries?.map((e: any) => (
                                                <TableRow key={e.id}>
                                                    <TableCell className="font-bold">{e.grade}</TableCell>
                                                    <TableCell>{e.minPercent}% - {e.maxPercent}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Complex Modal with Dynamic Entries */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg border">
                        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Grading Scale' : 'Add Grading Scale'}</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{typeof error === "string" ? error : JSON.stringify(error)}</div>}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Scale Name *</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Primary Grading Std"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type *</Label>
                                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE">Percentage Based</SelectItem>
                                            <SelectItem value="GPA">GPA Based</SelectItem>
                                            <SelectItem value="GRADE_POINT">Grade Point Based</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isDefault"
                                    checked={formData.isDefault}
                                    onCheckedChange={(v) => setFormData({ ...formData, isDefault: !!v })}
                                />
                                <Label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Set as default scale for new exams
                                </Label>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-lg">Grade Entries</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Row
                                    </Button>
                                </div>
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Grade</TableHead>
                                                <TableHead>Min %</TableHead>
                                                <TableHead>Max %</TableHead>
                                                <TableHead>Order</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entries.map((entry, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <Input
                                                            required
                                                            className="w-16 h-8"
                                                            value={entry.grade}
                                                            onChange={(e) => updateEntry(idx, 'grade', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            className="w-20 h-8"
                                                            value={entry.minPercent}
                                                            onChange={(e) => updateEntry(idx, 'minPercent', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            className="w-20 h-8"
                                                            value={entry.maxPercent}
                                                            onChange={(e) => updateEntry(idx, 'maxPercent', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            className="w-16 h-8"
                                                            value={entry.order}
                                                            onChange={(e) => updateEntry(idx, 'order', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive h-8 w-8 p-0"
                                                            onClick={() => removeEntry(idx)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {editingId ? 'Update Scale' : 'Create Scale'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple Checkbox polyfill if not available in components/ui
function Checkbox({ id, checked, onCheckedChange }: { id: string, checked: boolean, onCheckedChange: (v: boolean) => void }) {
    return (
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
    );
}
