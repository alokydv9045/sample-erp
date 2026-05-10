'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { examAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportCardPage() {
    const params = useParams();
    const examId = params.id as string;
    const [reviewData, setReviewData] = useState<any>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [reportCard, setReportCard] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCard, setIsLoadingCard] = useState(false);

    const fetchStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await examAPI.getClassTeacherReview(examId);
            setReviewData(data);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [examId]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const loadReportCard = async (studentId: string) => {
        try {
            setIsLoadingCard(true);
            setSelectedStudentId(studentId);
            const data = await examAPI.getReportCard(examId, studentId);
            setReportCard(data.reportCard);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to load report card');
        } finally {
            setIsLoadingCard(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/exams/${examId}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Exam</Link>
                </Button>
                {reportCard && (
                    <Button onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />Print Report Card
                    </Button>
                )}
            </div>

            <h1 className="text-2xl font-bold">Report Cards</h1>

            {/* Student Selector */}
            {!reportCard && (
                <Card>
                    <CardHeader><CardTitle>Select Student</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                            {reviewData?.students?.map((result: any) => (
                                <button
                                    key={result.id}
                                    onClick={() => loadReportCard(result.studentId)}
                                    className={`rounded-lg border p-3 text-left transition-colors hover:bg-accent ${selectedStudentId === result.studentId ? 'border-primary bg-accent' : ''
                                        }`}
                                >
                                    <p className="font-medium text-sm">
                                        {result.student?.user?.firstName} {result.student?.user?.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {result.percentage?.toFixed(1)}% • {result.grade} • {result.result}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {isLoadingCard && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}

            {/* Report Card */}
            {reportCard && !isLoadingCard && (
                <div className="space-y-4">
                    <Button variant="outline" size="sm" onClick={() => { setReportCard(null); setSelectedStudentId(null); }}>
                        ← Back to Student List
                    </Button>

                    {/* Print-optimized report card */}
                    <div id="report-card-print" className="bg-white border rounded-lg p-8 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0">
                        {/* School Header */}
                        <div className="text-center border-b pb-4 mb-4">
                            <h1 className="text-2xl font-bold uppercase">{reportCard.school?.name}</h1>
                            <p className="text-sm text-muted-foreground mt-1">REPORT CARD</p>
                            <p className="text-sm">
                                {reportCard.exam?.name} — {reportCard.exam?.academicYear}
                            </p>
                        </div>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4">
                            <div>
                                <p className="text-sm"><span className="text-muted-foreground">Name:</span> <strong>{reportCard.student?.name}</strong></p>
                                <p className="text-sm"><span className="text-muted-foreground">Class:</span> <strong>{reportCard.student?.class} {reportCard.student?.section ? `- ${reportCard.student.section}` : ''}</strong></p>
                            </div>
                            <div>
                                <p className="text-sm"><span className="text-muted-foreground">Roll No:</span> <strong>{reportCard.student?.rollNumber || '—'}</strong></p>
                                <p className="text-sm"><span className="text-muted-foreground">Adm No:</span> <strong>{reportCard.student?.admissionNumber || '—'}</strong></p>
                            </div>
                        </div>

                        {/* Subject Marks Table */}
                        <div className="rounded-md border mb-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-center">Max Marks</TableHead>
                                        <TableHead className="text-center">Obtained</TableHead>
                                        <TableHead className="text-center">Grade</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportCard.subjects?.map((sub: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{sub.name}</TableCell>
                                            <TableCell className="text-center">{sub.totalMarks}</TableCell>
                                            <TableCell className="text-center">
                                                {sub.isAbsent ? <span className="text-red-500">AB</span> : sub.obtainedMarks}
                                            </TableCell>
                                            <TableCell className="text-center">{sub.grade}</TableCell>
                                            <TableCell className="text-center">
                                                {sub.isAbsent ? (
                                                    <Badge variant="destructive" className="text-xs">Absent</Badge>
                                                ) : sub.passed ? (
                                                    <Badge className="bg-green-100 text-green-700 text-xs" variant="secondary">Pass</Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-xs">Fail</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Total Row */}
                                    <TableRow className="bg-gray-50 font-bold">
                                        <TableCell>TOTAL</TableCell>
                                        <TableCell className="text-center">{reportCard.summary?.totalMarks}</TableCell>
                                        <TableCell className="text-center">{reportCard.summary?.obtainedMarks}</TableCell>
                                        <TableCell className="text-center">{reportCard.summary?.grade}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={reportCard.summary?.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                                variant="secondary"
                                            >
                                                {reportCard.summary?.result}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4 border-b pb-4 mb-4 text-center">
                            <div>
                                <p className="text-xs text-muted-foreground">Percentage</p>
                                <p className="text-lg font-bold">{reportCard.summary?.percentage}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Rank</p>
                                <p className="text-lg font-bold">{reportCard.summary?.rank} / {reportCard.summary?.totalStudents}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Remarks</p>
                                <p className="text-lg font-bold">{reportCard.summary?.remarks}</p>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-8 pt-8 mt-4">
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2">
                                    <p className="text-sm font-medium">Class Teacher</p>
                                    <p className="text-xs text-muted-foreground">{reportCard.classTeacher || '—'}</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2">
                                    <p className="text-sm font-medium">Principal</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print CSS */}
            <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #report-card-print, #report-card-print * { visibility: visible; }
          #report-card-print { position: absolute; left: 0; top: 0; width: 100%; }
          nav, header, footer, button { display: none !important; }
        }
      `}</style>
        </div>
    );
}
