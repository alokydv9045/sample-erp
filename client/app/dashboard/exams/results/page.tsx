'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reportCardAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentResultsPage() {
    const { user } = useAuth();
    const [reportCards, setReportCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    const fetchResults = useCallback(async () => {
        try {
            setIsLoading(true);
            // The backend should filter by the logged in student if role is STUDENT
            const response = await reportCardAPI.getAll({ status: 'PUBLISHED' });
            setReportCards(response.reportCards || []);
        } catch (error) {
            console.error('Fetch results error:', error);
            toast.error('Failed to load results');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const handleDownload = async (id: string, name: string) => {
        try {
            setIsDownloading(id);
            const blob = await reportCardAPI.download(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ReportCard_${name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download report card');
        } finally {
            setIsDownloading(null);
        }
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
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">My Examination Results</h1>
                <p className="text-muted-foreground">View and download your official report cards.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Academic History</CardTitle>
                    <CardDescription>All published examination results for the current academic year.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reportCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                            <h3 className="text-lg font-medium">No results published yet</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Once your examinations are completed and results are approved by the principal, they will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Examination</TableHead>
                                        <TableHead>Term</TableHead>
                                        <TableHead className="hidden md:table-cell">Academic Year</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportCards.map((rc) => (
                                        <TableRow key={rc.id}>
                                            <TableCell className="font-medium">{rc.exam?.name}</TableCell>
                                            <TableCell>{rc.exam?.term?.name || rc.exam?.examType || '-'}</TableCell>
                                            <TableCell className="hidden md:table-cell">{rc.exam?.academicYear?.name}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                    PUBLISHED
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleDownload(rc.id, rc.exam.name)}
                                                    disabled={!!isDownloading}
                                                >
                                                    {isDownloading === rc.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Download className="h-4 w-4 mr-2" />
                                                    )}
                                                    Download PDF
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-blue-50/50 border-blue-100 italic">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800">
                            <AlertCircle className="h-4 w-4" /> Note for Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-blue-700">
                            If you find any discrepancy in your marks, please contact your class teacher within 7 days of result publication.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
