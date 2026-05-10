'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { examAPI, reportCardAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ArrowLeft, Loader2, FileCheck, Send, AlertCircle, CheckCircle2, Search,
    Download, Globe, FileText
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function ExamReviewPage() {
    const params = useParams();
    const router = useRouter();
    const { isTeacher, isAdmin } = usePermissions();

    const [data, setData] = useState<any>(null);
    const [reportCards, setReportCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    useEffect(() => {
        if (params.id) {
            fetchReviewData(params.id as string);
        }
    }, [params.id]);

    const fetchReviewData = async (examId: string) => {
        try {
            setIsLoading(true);
            const [consolidatedRes, reportCardsRes] = await Promise.all([
                examAPI.getConsolidated(examId),
                reportCardAPI.getAll({ examId }),
            ]);
            setData(consolidatedRes);
            setReportCards(reportCardsRes.reportCards || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch review data');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectAll = (checked: any) => {
        if (!checked) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(results.map((r: any) => r.studentId) || []);
        }
    };

    const toggleSelectStudent = (id: string) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds([...selectedStudentIds, id]);
        }
    };

    const handleGenerateReportCards = async () => {
        if (selectedStudentIds.length === 0) return;
        try {
            setIsProcessing(true);
            setMessage('');
            const res = await reportCardAPI.generate({
                examId: params.id as string,
                studentIds: selectedStudentIds,
            });
            setMessage(`✅ ${res.message}`);
            fetchReviewData(params.id as string);
            setSelectedStudentIds([]);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Generation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmitForApproval = async () => {
        // Submit generated report cards that are in DRAFT or REJECTED status
        const targets = reportCards
            .filter(rc => ['DRAFT', 'REJECTED'].includes(rc.status))
            .map(rc => rc.id);

        if (targets.length === 0) {
            setMessage('ℹ️ No draft/rejected report cards to submit.');
            return;
        }

        try {
            setIsProcessing(true);
            setMessage('');
            const res = await reportCardAPI.bulkSubmit(targets);
            setMessage(`🚀 ${res.message}`);
            fetchReviewData(params.id as string);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Submission failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async (rcId: string, studentName: string) => {
        try {
            setIsProcessing(true);
            const blob = await reportCardAPI.download(rcId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ReportCard_${studentName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err: any) {
            setError('Failed to download report card');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePublish = async () => {
        try {
            setIsProcessing(true);
            const approvedIds = reportCards
                .filter((rc: any) => rc.status === 'APPROVED')
                .map((rc: any) => rc.id);

            if (approvedIds.length === 0) {
                alert('No approved report cards found to publish');
                return;
            }

            await reportCardAPI.publish(approvedIds);
            setMessage(`${approvedIds.length} results published successfully`);
            fetchReviewData(params.id as string);
        } catch (err: any) {
            setError('Failed to publish results');
        } finally {
            setIsProcessing(false);
        }
    };

    const getRCStatusBadge = (studentId: string, studentName: string) => {
        const rc = reportCards.find(r => r.studentId === studentId);
        if (!rc) return <Badge variant="outline" className="text-muted-foreground">Not Generated</Badge>;

        switch (rc.status) {
            case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
            case 'SUBMITTED': return <Badge className="bg-blue-100 text-blue-700">Submitted</Badge>;
            case 'APPROVED':
                return (
                    <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">Approved</Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(rc.id, studentName)} className="h-6 w-6 p-0">
                            <Download className="h-3 w-3" />
                        </Button>
                    </div>
                );
            case 'PUBLISHED':
                return (
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700">Published</Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(rc.id, studentName)} className="h-6 w-6 p-0">
                            <Download className="h-3 w-3" />
                        </Button>
                    </div>
                );
            case 'REJECTED': return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
            default: return <Badge variant="outline">{rc.status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/exams/${params.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Exam
                    </Link>
                </Button>
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                    {error || 'Data not found'}
                </div>
            </div>
        );
    }

    const { exam, subjectProgress, results } = data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/exams/${params.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Exam
                    </Link>
                </Button>
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerateReportCards}
                        disabled={selectedStudentIds.length === 0 || isProcessing}
                        variant="outline"
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Generate {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
                    </Button>
                    <Button
                        onClick={handleSubmitForApproval}
                        disabled={isProcessing || reportCards.length === 0}
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit for Approval
                    </Button>
                    {reportCards.some((rc: any) => rc.status === 'APPROVED') && (
                        <Button
                            onClick={handlePublish}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                            Publish Results
                        </Button>
                    )}
                </div>
            </div>

            {message && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{message}</span>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Exam Summary */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Class Review: {exam.name}</CardTitle>
                        <CardDescription>{exam.className} • {exam.academicYear}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total Students</p>
                                <p className="text-xl font-bold">{results.length}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Passed</p>
                                <p className="text-xl font-bold text-green-600">{results.filter((r: any) => r.result === 'PASS').length}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Failed</p>
                                <p className="text-xl font-bold text-red-600">{results.filter((r: any) => r.result === 'FAIL').length}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Generated RC</p>
                                <p className="text-xl font-bold">{reportCards.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subject Completion */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Subject Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {subjectProgress.map((s: any) => (
                                <div key={s.subjectId} className="flex items-center justify-between text-xs">
                                    <span className="truncate mr-2">{s.subjectName}</span>
                                    <Badge variant={s.isComplete ? "outline" : "secondary"} className={s.isComplete ? "text-green-600 border-green-200 bg-green-50" : ""}>
                                        {s.entered}/{s.total}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Results Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Consolidated Marksheet</CardTitle>
                        <CardDescription>Full subject-wise breakdown for all students</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground border-l pl-4">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span>AB: Absent</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            <span>M: Medical</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                            <span>-: Not Entered</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={selectedStudentIds.length === results.length && results.length > 0}
                                            onCheckedChange={(checked: any) => toggleSelectAll(checked)}
                                        />
                                    </TableHead>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead className="min-w-[150px]">Student</TableHead>
                                    {subjectProgress.map((s: any) => (
                                        <TableHead key={s.subjectId} className="text-center font-bold text-[10px] uppercase tracking-wider">
                                            {s.subjectCode || s.subjectName.substring(0, 3)}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center font-bold">Total</TableHead>
                                    <TableHead className="text-center">%</TableHead>
                                    <TableHead className="text-center">Result</TableHead>
                                    <TableHead className="text-right">RC Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((r: any) => (
                                    <TableRow key={r.studentId}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedStudentIds.includes(r.studentId)}
                                                onCheckedChange={() => toggleSelectStudent(r.studentId)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{r.rank}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-900 leading-none mb-1">{r.studentName}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{r.section}</span>
                                            </div>
                                        </TableCell>
                                        {subjectProgress.map((s: any) => {
                                            const m = r.marks?.find((mk: any) => mk.subjectCode === s.subjectCode);
                                            return (
                                                <TableCell key={s.subjectId} className="text-center text-xs border-x border-slate-50">
                                                    {m ? (
                                                        m.isAbsent ? (
                                                            <Badge variant="outline" className={`h-5 w-8 flex items-center justify-center p-0 border-none font-bold ${m.absenceType === 'MEDICAL' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'}`}>
                                                                {m.absenceType === 'MEDICAL' ? 'M' : 'AB'}
                                                            </Badge>
                                                        ) : (
                                                            <span className="font-medium text-slate-700">{m.obtainedMarks}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="text-center font-bold text-sm bg-slate-50/50">{r.obtainedMarks}</TableCell>
                                        <TableCell className="text-center text-sm">{r.percentage}%</TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={r.result === 'PASS' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'} variant="outline">
                                                {r.result}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">{getRCStatusBadge(r.studentId, r.studentName)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
