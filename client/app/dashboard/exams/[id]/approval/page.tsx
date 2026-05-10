'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { reportCardAPI, examAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Info, Download } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function PrincipalApprovalPage() {
    const params = useParams();
    const { isAdmin } = usePermissions();

    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
    const [exam, setExam] = useState<any>(null);
    const [reportCards, setReportCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchData = useCallback(async (examId: string) => {
        try {
            setIsLoading(true);
            const [examRes, rcRes] = await Promise.all([
                examAPI.getById(examId),
                reportCardAPI.getAll({ examId }),
            ]);
            setExam(examRes.exam);
            setReportCards(rcRes.reportCards || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch approval data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (params.id) {
            fetchData(params.id as string);
        }
    }, [params.id, fetchData]);

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

    const filteredRCs = reportCards.filter(rc =>
        activeTab === 'pending' ? rc.status === 'SUBMITTED' : rc.status === 'APPROVED'
    );

    const handleBulkApprove = async () => {
        const ids = selectedIds.length > 0 ? selectedIds : [];
        if (ids.length === 0) return;

        try {
            setIsProcessing(true);
            setMessage('');
            const res = await reportCardAPI.bulkApprove(ids);
            setMessage(`✅ ${res.message}`);
            await fetchData(params.id as string);
            setSelectedIds([]);
            setActiveTab('approved');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Approval failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (id: string, remark: string) => {
        if (!remark) {
            alert('Please provide a remark for rejection.');
            return;
        }
        try {
            setIsProcessing(true);
            setMessage('');
            const res = await reportCardAPI.reject(id, remark);
            setMessage(`❌ ${res.message}`);
            await fetchData(params.id as string);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Rejection failed');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="p-12 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">Only the Principal / Admin can access the approval panel.</p>
                <Button asChild variant="outline">
                    <Link href={`/dashboard/exams/${params.id}`}>Back to Exam</Link>
                </Button>
            </div>
        );
    }

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
                    {activeTab === 'pending' && (
                        <Button
                            onClick={handleBulkApprove}
                            disabled={selectedIds.length === 0 || isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Approve Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </Button>
                    )}
                </div>
            </div>

            {message && (
                <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{message}</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span>{typeof error === "string" ? error : JSON.stringify(error)}</span>
                </div>
            )}

            <div className="flex items-center gap-4 border-b pb-1">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Pending Approval ({reportCards.filter(rc => rc.status === 'SUBMITTED').length})
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'approved' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Approved History ({reportCards.filter(rc => rc.status === 'APPROVED').length})
                </button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {activeTab === 'pending' ? 'Pending Approvals' : 'Approved Report Cards'}
                    </CardTitle>
                    <CardDescription>
                        {exam?.name} • {exam?.class?.name}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredRCs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <Info className="h-8 w-8 mb-2" />
                            <p>No {activeTab} report cards found.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {activeTab === 'pending' && (
                                            <TableHead className="w-10">
                                                <Checkbox
                                                    checked={selectedIds.length === filteredRCs.length && filteredRCs.length > 0}
                                                    onCheckedChange={(checked: any) => {
                                                        if (checked) setSelectedIds(filteredRCs.map(rc => rc.id));
                                                        else setSelectedIds([]);
                                                    }}
                                                />
                                            </TableHead>
                                        )}
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Admission No</TableHead>
                                        <TableHead>Marks %</TableHead>
                                        <TableHead>Grade</TableHead>
                                        {activeTab === 'pending' && <TableHead className="w-[30%]">Action</TableHead>}
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRCs.map((rc) => (
                                        <TableRow key={rc.id}>
                                            {activeTab === 'pending' && (
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(rc.id)}
                                                        onCheckedChange={(checked: boolean) => {
                                                            if (checked) setSelectedIds([...selectedIds, rc.id]);
                                                            else setSelectedIds(selectedIds.filter(id => id !== rc.id));
                                                        }}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell className="font-medium text-sm">
                                                {rc.student?.user?.firstName} {rc.student?.user?.lastName}
                                            </TableCell>
                                            <TableCell className="text-sm">{rc.student?.admissionNo}</TableCell>
                                            <TableCell className="text-sm font-semibold">{rc.percentage}%</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{rc.grade}</Badge>
                                            </TableCell>
                                            {activeTab === 'pending' && (
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id={`remark-${rc.id}`}
                                                            placeholder="Rejection remark..."
                                                            className="h-8 text-xs"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                                            onClick={() => {
                                                                const input = document.getElementById(`remark-${rc.id}`) as HTMLInputElement;
                                                                handleReject(rc.id, input.value);
                                                            }}
                                                            disabled={isProcessing}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                {rc.status === 'APPROVED' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(rc.id, `${rc.student?.user?.firstName} ${rc.student?.user?.lastName}`)}
                                                        disabled={isProcessing}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </Button>
                                                )}
                                                {activeTab === 'pending' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-600 hover:bg-green-50"
                                                        onClick={() => handleBulkApprove()}
                                                        disabled={isProcessing}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
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
