'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { reportCardAPI } from '@/lib/api';
import { Loader2, Plus, Save, Trash2, Layout, Eye, X, GraduationCap, Award } from 'lucide-react';
import { toast } from 'sonner';

// ---------- Mock data for preview ----------
const MOCK_STUDENT = {
    name: 'Arjun Sharma',
    rollNo: 'A-042',
    class: 'X-A',
    academicYear: '2025-2026',
    term: 'Term 1',
    attendance: 92,
    rank: 3,
    totalStudents: 38,
    subjects: [
        { name: 'Mathematics', marks: 88, maxMarks: 100, grade: 'A' },
        { name: 'Science', marks: 91, maxMarks: 100, grade: 'A+' },
        { name: 'English', marks: 76, maxMarks: 100, grade: 'B+' },
        { name: 'Social Studies', marks: 82, maxMarks: 100, grade: 'A' },
        { name: 'Hindi', marks: 79, maxMarks: 100, grade: 'B+' },
        { name: 'Computer Science', marks: 95, maxMarks: 100, grade: 'A+' },
    ],
    remarks: 'Arjun has shown excellent progress this term. He is enthusiastic, attentive, and consistently performs well in assessments. Encouraged to participate more in extracurricular activities.',
};

// ---------- Preview Modal ----------
function ReportCardPreview({ template, onClose }: { template: any; onClose: () => void }) {
    const totalObtained = MOCK_STUDENT.subjects.reduce((sum, s) => sum + s.marks, 0);
    const totalMax = MOCK_STUDENT.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const percentage = ((totalObtained / totalMax) * 100).toFixed(1);

    const gradeColor = (g: string) => {
        if (g === 'A+') return '#16a34a';
        if (g === 'A') return '#2563eb';
        if (g === 'B+') return '#7c3aed';
        return '#374151';
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Report Card Preview</DialogTitle>
                </DialogHeader>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 rounded-full bg-gray-100 hover:bg-gray-200 p-1.5 transition-colors"
                >
                    <X className="h-4 w-4 text-gray-600" />
                </button>

                {/* Report Card */}
                <div className="bg-white text-gray-800 font-sans" style={{ fontFamily: 'Georgia, serif' }}>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            {template.schoolLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={template.schoolLogo} alt="School Logo" className="h-16 w-16 object-contain rounded-full bg-white p-1" />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                                    <GraduationCap className="h-9 w-9 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold tracking-wide">EduSphere International School</h2>
                                <p className="text-blue-200 text-xs mt-0.5">Excellence in Education</p>
                            </div>
                            <div className="mt-2 px-6 py-1.5 bg-white/20 rounded-full text-sm font-semibold tracking-widest uppercase">
                                Academic Report Card
                            </div>
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="px-8 pt-6 pb-4 border-b border-dashed border-gray-300">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <InfoRow label="Student Name" value={MOCK_STUDENT.name} />
                            <InfoRow label="Academic Year" value={MOCK_STUDENT.academicYear} />
                            <InfoRow label="Roll Number" value={MOCK_STUDENT.rollNo} />
                            <InfoRow label="Term" value={MOCK_STUDENT.term} />
                            <InfoRow label="Class & Section" value={MOCK_STUDENT.class} />
                        </div>
                    </div>

                    {/* Subject Marks Table */}
                    <div className="px-8 py-5">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-800 mb-3">Academic Performance</h3>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-blue-800 text-white">
                                    <th className="px-3 py-2 text-left rounded-tl-md">Subject</th>
                                    <th className="px-3 py-2 text-center">Max Marks</th>
                                    <th className="px-3 py-2 text-center">Marks Obtained</th>
                                    <th className="px-3 py-2 text-center rounded-tr-md">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_STUDENT.subjects.map((subj, i) => (
                                    <tr key={subj.name} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="px-3 py-2 font-medium">{subj.name}</td>
                                        <td className="px-3 py-2 text-center text-gray-600">{subj.maxMarks}</td>
                                        <td className="px-3 py-2 text-center font-semibold">{subj.marks}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="font-bold text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: gradeColor(subj.grade) }}>
                                                {subj.grade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                    <td className="px-3 py-2">Total</td>
                                    <td className="px-3 py-2 text-center">{totalMax}</td>
                                    <td className="px-3 py-2 text-center">{totalObtained}</td>
                                    <td className="px-3 py-2 text-center text-blue-700">{percentage}%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Summary Cards */}
                    <div className="px-8 pb-5 grid grid-cols-3 gap-3">
                        <SummaryBox label="Overall %" value={`${percentage}%`} color="blue" />
                        {template.showAttendance && (
                            <SummaryBox label="Attendance" value={`${MOCK_STUDENT.attendance}%`} color="green" />
                        )}
                        {template.showRank && (
                            <SummaryBox label="Class Rank" value={`${MOCK_STUDENT.rank} / ${MOCK_STUDENT.totalStudents}`} color="purple" icon={<Award className="h-3.5 w-3.5" />} />
                        )}
                    </div>

                    {/* Remarks */}
                    {template.showRemarks && (
                        <div className="px-8 pb-5">
                            <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Class Teacher Remarks</p>
                                <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{MOCK_STUDENT.remarks}&rdquo;</p>
                            </div>
                        </div>
                    )}

                    {/* Signatures */}
                    {(template.signedByTeacher || template.signedByPrincipal) && (
                        <div className="px-8 pb-8 pt-2 border-t border-dashed border-gray-300">
                            <div className={`grid gap-8 mt-6 ${template.signedByTeacher && template.signedByPrincipal ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
                                {template.signedByTeacher && (
                                    <div className="text-center">
                                        <div className="border-b-2 border-gray-400 w-40 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">Class Teacher Signature</p>
                                    </div>
                                )}
                                {template.signedByPrincipal && (
                                    <div className="text-center">
                                        <div className="border-b-2 border-gray-400 w-40 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">Principal Signature</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preview watermark */}
                    <div className="text-center py-2 bg-yellow-50 border-t border-yellow-200">
                        <p className="text-[10px] text-yellow-700 font-semibold uppercase tracking-widest">
                            ⚠ Preview Only — Template: {template.name}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2">
            <span className="text-gray-500 min-w-[120px]">{label}:</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function SummaryBox({ label, value, color, icon }: { label: string; value: string; color: 'blue' | 'green' | 'purple'; icon?: React.ReactNode }) {
    const colors = {
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        green: 'bg-green-50 border-green-200 text-green-800',
        purple: 'bg-purple-50 border-purple-200 text-purple-800',
    };
    return (
        <div className={`rounded-lg border p-3 text-center ${colors[color]}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70 flex items-center justify-center gap-1">{icon}{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
        </div>
    );
}

// ---------- Main Page ----------
export default function ReportTemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const response = await reportCardAPI.getTemplates();
            setTemplates(response.templates || []);
            if (response.templates?.length > 0) {
                const defaultTpl = response.templates.find((t: any) => t.isDefault) || response.templates[0];
                setEditingTemplate(defaultTpl);
            } else {
                handleAddNew();
            }
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingTemplate?.name) {
            toast.error('Template name is required');
            return;
        }
        try {
            setIsSaving(true);
            if (editingTemplate.id) {
                await reportCardAPI.updateTemplate(editingTemplate.id, editingTemplate);
                toast.success('Template updated successfully');
            } else {
                await reportCardAPI.createTemplate(editingTemplate);
                toast.success('Template created successfully');
            }
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddNew = () => {
        setEditingTemplate({
            name: 'New Template',
            showAttendance: true,
            showRemarks: true,
            showRank: false,
            signedByTeacher: true,
            signedByPrincipal: true,
            isDefault: false
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Preview Modal */}
            {showPreview && editingTemplate && (
                <ReportCardPreview template={editingTemplate} onClose={() => setShowPreview(false)} />
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Report Card Templates</h1>
                    <p className="text-muted-foreground">Customize the layout and content of generated report cards.</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" /> New Template
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Templates List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Available Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {templates.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-4">No templates found. Create one to get started.</p>
                        ) : (
                            templates.map((tpl) => (
                                <div
                                    key={tpl.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${editingTemplate?.id === tpl.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                                    onClick={() => setEditingTemplate(tpl)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Layout className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{tpl.name}</span>
                                    </div>
                                    {tpl.isDefault && (
                                        <Badge variant="secondary" className="text-[10px] uppercase">Default</Badge>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Template Editor */}
                {editingTemplate && (
                    <Card className="lg:col-span-2 shadow-sm border-t-4 border-t-primary">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Edit Template: {editingTemplate.name}</CardTitle>
                                    <CardDescription>Configure visibility and settings for this layout.</CardDescription>
                                </div>
                                {/* Preview Button */}
                                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                                    <Eye className="h-4 w-4" />
                                    Preview
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Template Name</Label>
                                    <Input
                                        value={editingTemplate.name}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        placeholder="e.g., Annual Report Card 2024"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>School Logo URL (Optional)</Label>
                                    <Input
                                        value={editingTemplate.schoolLogo || ''}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, schoolLogo: e.target.value })}
                                        placeholder="https://example.com/logo.png"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Leave empty to use the default system logo.</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold text-sm">Visibility Toggles</h3>

                                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label>Show Attendance Summary</Label>
                                        <p className="text-xs text-muted-foreground italic">Include student attendance percentage on the card.</p>
                                    </div>
                                    <Switch
                                        checked={editingTemplate.showAttendance}
                                        onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, showAttendance: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label>Show Class Teacher Remarks</Label>
                                        <p className="text-xs text-muted-foreground italic">Include comments generated by the class teacher.</p>
                                    </div>
                                    <Switch
                                        checked={editingTemplate.showRemarks}
                                        onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, showRemarks: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label>Show Student Rank</Label>
                                        <p className="text-xs text-muted-foreground italic">Display the student's rank within the class.</p>
                                    </div>
                                    <Switch
                                        checked={editingTemplate.showRank}
                                        onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, showRank: checked })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold text-sm">Signatures</h3>

                                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <Label>Include Class Teacher Signature Line</Label>
                                    <Switch
                                        checked={editingTemplate.signedByTeacher}
                                        onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, signedByTeacher: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <Label>Include Principal Signature Line</Label>
                                    <Switch
                                        checked={editingTemplate.signedByPrincipal}
                                        onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, signedByPrincipal: checked })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-primary font-bold">Set as Default Template</Label>
                                        <p className="text-xs text-muted-foreground italic">This template will be used for all report cards unless specified otherwise.</p>
                                    </div>
                                    <Switch
                                        checked={editingTemplate.isDefault}
                                        onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isDefault: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-6">
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" disabled={templates.length <= 1}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-1.5">
                                    <Eye className="h-4 w-4" /> Preview
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Template
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
