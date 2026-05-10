'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { feeAPI, studentAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Search, FileText, IndianRupee } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function StudentLedgerPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
    const { canManageFees } = usePermissions();

    const [adjustmentForm, setAdjustmentForm] = useState({
        ledgerId: '',
        type: 'DISCOUNT',
        amount: '',
        reason: ''
    });

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const studentsData = await studentAPI.getAll({ search: searchQuery });
            const foundStudent = studentsData.students?.find((s: any) =>
                s.admissionNumber.toLowerCase() === searchQuery.toLowerCase() ||
                `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (!foundStudent) {
                alert('Student not found');
                return;
            }

            const statusData = await feeAPI.getStudentStatus(foundStudent.id);

            setStudent({
                ...foundStudent,
                ledgers: statusData.ledgers,
                summary: statusData.summary,
                payments: statusData.payments // Assuming backend returns payments as well, if we updated it to
            });

            if (statusData.ledgers?.length > 0) {
                setAdjustmentForm(prev => ({ ...prev, ledgerId: statusData.ledgers[0].id }));
            }
        } catch (err) {
            console.error('Student search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleRequestAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await feeAPI.requestAdjustment({
                studentId: student.id,
                ledgerId: adjustmentForm.ledgerId,
                type: adjustmentForm.type,
                amount: adjustmentForm.amount,
                reason: adjustmentForm.reason
            });
            setIsAdjustmentDialogOpen(false);
            setAdjustmentForm({ ledgerId: student.ledgers?.[0]?.id || '', type: 'DISCOUNT', amount: '', reason: '' });
            handleSearch(); // Refresh data
        } catch (err) {
            console.error('Adjustment request failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'PARTIAL': return 'bg-orange-100 text-orange-700';
            case 'PENDING': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/fees">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Fees
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student Fee Ledger</CardTitle>
                    <CardDescription>View detailed fee breakdown and history for a student</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Student Search */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search Student</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Enter admission number or name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                    </div>

                    {/* Student Details */}
                    {student && (
                        <div className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50 border">
                                <div>
                                    <p className="text-sm text-muted-foreground">Student Name</p>
                                    <p className="font-medium">{student.user?.firstName} {student.user?.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Admission No</p>
                                    <p className="font-medium">{student.admissionNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Class</p>
                                    <p className="font-medium">{student.currentClass?.name} - {student.section?.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Overall Status</p>
                                    <Badge className={getStatusBadge(student.summary?.totalPending === 0 ? 'PAID' : (student.summary?.totalPaid > 0 ? 'PARTIAL' : 'PENDING'))}>
                                        {student.summary?.totalPending === 0 ? 'CLEARED' : 'DUES PENDING'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Fee Ledgers */}
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Active Fee Structures</h3>
                                    {canManageFees && (
                                        <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">Request Adjustment</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Request Fee Adjustment</DialogTitle>
                                                    <DialogDescription>Apply discount, scholarship or waiver</DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleRequestAdjustment} className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Select Ledger</Label>
                                                        <Select value={adjustmentForm.ledgerId} onValueChange={(v) => setAdjustmentForm({ ...adjustmentForm, ledgerId: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {student.ledgers?.map((l: any) => (
                                                                    <SelectItem key={l.id} value={l.id}>{l.feeStructure?.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Adjustment Type</Label>
                                                        <Select value={adjustmentForm.type} onValueChange={(v) => setAdjustmentForm({ ...adjustmentForm, type: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="DISCOUNT">Discount</SelectItem>
                                                                <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                                                                <SelectItem value="WAIVER">Penalty Waiver</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Amount</Label>
                                                        <Input type="number" required value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Reason</Label>
                                                        <Input required value={adjustmentForm.reason} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} />
                                                    </div>
                                                    <Button disabled={isLoading} type="submit" className="w-full">
                                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Request'}
                                                    </Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {student.ledgers?.map((ledger: any) => (
                                    <Card key={ledger.id} className="overflow-hidden">
                                        <CardHeader className="bg-muted/30 pb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">{ledger.feeStructure?.name}</CardTitle>
                                                    <CardDescription>Academic Year: {ledger.academicYear?.name || 'Current'}</CardDescription>
                                                </div>
                                                <Badge className={getStatusBadge(ledger.status)}>{ledger.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Total Fee</p>
                                                    <p className="font-semibold">₹{ledger.totalPayable?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Discount/Adj</p>
                                                    <p className="font-semibold text-green-600">₹{ledger.totalDiscount?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Net Payable</p>
                                                    <p className="font-semibold">₹{(ledger.totalPayable - ledger.totalDiscount)?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Paid</p>
                                                    <p className="font-semibold text-blue-600">₹{ledger.totalPaid?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Pending</p>
                                                    <p className="font-semibold text-red-600">₹{ledger.totalPending?.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Detailed Head Breakdown */}
                                            <div className="mt-4 pt-4 border-t border-dashed">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Fee Head Breakdown</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                                    {(ledger.feeStructure?.items || []).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs py-1 px-2 bg-muted/30 rounded">
                                                            <span className="font-medium text-slate-600">{item.headName}</span>
                                                            <span className="font-bold">₹{item.amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Payment History could go here if the API returned it */}

                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
