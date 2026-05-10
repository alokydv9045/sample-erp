'use client';

import { useState, useEffect, useCallback } from 'react';
import { hrAPI, payrollAPI, serviceAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Clock, Calendar, UserCheck, FileText,
    IndianRupee, Plus, Loader2, Download, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function MyHRPage() {
    const { user } = useAuth();


    // ── Leaves State ─────────────────────────────────────────────────────
    const [balances, setBalances] = useState<any[]>([]);
    const [myLeaves, setMyLeaves] = useState<any[]>([]);
    const [isLeavesLoading, setIsLeavesLoading] = useState(false);
    const [leaveDialog, setLeaveDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
        type: 'CL',
        startDate: '',
        endDate: '',
        reason: ''
    });

    // ── Payroll State ─────────────────────────────────────────────────────
    const [myPayrolls, setMyPayrolls] = useState<any[]>([]);
    const [isPayrollLoading, setIsPayrollLoading] = useState(false);

    // ── Fetch Data ────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setIsLeavesLoading(true);
        setIsPayrollLoading(true);
        try {
            const [balRes, leavesRes, payRes] = await Promise.all([
                hrAPI.getMyLeaveBalances(),
                serviceAPI.getAll({ type: 'LEAVE', myRequests: true }),
                payrollAPI.getEmployeePayroll()
            ]);
            setBalances(balRes?.balances || []);
            setMyLeaves(leavesRes || []);
            setMyPayrolls(payRes || []);
        } catch (err) {
            console.error('Failed to fetch HR data', err);
        } finally {
            setIsLeavesLoading(false);
            setIsPayrollLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await hrAPI.requestLeave({
                leaveType: leaveForm.type,
                startDate: leaveForm.startDate,
                endDate: leaveForm.endDate,
                reason: leaveForm.reason
            });
            toast.success('Leave application submitted');
            setLeaveDialog(false);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to apply leave');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My HR Portal</h1>
                    <p className="text-muted-foreground">Manage your leaves, payslips, and attendance.</p>
                </div>
                <Dialog open={leaveDialog} onOpenChange={setLeaveDialog}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Apply for Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Leave Application</DialogTitle>
                            <DialogDescription>Submit your leave request for approval.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleApplyLeave} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Leave Type</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={leaveForm.type}
                                    onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                                >
                                    <option value="CL">Casual Leave (CL)</option>
                                    <option value="SL">Sick Leave (SL)</option>
                                    <option value="EL">Earned Leave (EL)</option>
                                    <option value="MATERNITY">Maternity Leave</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} required />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setLeaveDialog(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Application
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="leaves" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="leaves">
                        <Clock className="mr-2 h-4 w-4" /> Leave Management
                    </TabsTrigger>
                    <TabsTrigger value="payroll">
                        <IndianRupee className="mr-2 h-4 w-4" /> My Payslips
                    </TabsTrigger>
                </TabsList>

                {/* ── Leaves Tab ── */}
                <TabsContent value="leaves" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        {balances.map(b => (
                            <Card key={b.leaveType}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">{b.leaveType}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{b.total - b.used - b.pending}</div>
                                    <p className="text-xs text-muted-foreground">Available Balance</p>
                                    <div className="mt-2 text-xs">
                                        Total: {b.total} | Used: {b.used} | Pending: {b.pending}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Leave Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(myLeaves || []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                No leave requests found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (myLeaves || []).map(l => (
                                            <TableRow key={l.id}>
                                                <TableCell className="text-sm">
                                                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{l.subject}</Badge></TableCell>
                                                <TableCell className="text-sm max-w-[200px] truncate">{l.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant={l.status === 'APPROVED' ? 'default' : l.status === 'REJECTED' ? 'destructive' : 'outline'}>
                                                        {l.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{l.remarks || '—'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Payroll Tab ── */}
                <TabsContent value="payroll" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payslip History</CardTitle>
                            <CardDescription>View and download your monthly salary slips.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month/Year</TableHead>
                                        <TableHead>Gross Salary</TableHead>
                                        <TableHead>Deductions (LOP)</TableHead>
                                        <TableHead>Net Salary</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(myPayrolls || []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                No payslips available yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (myPayrolls || []).map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell>₹{p.grossSalary.toLocaleString('en-IN')}</TableCell>
                                                <TableCell className="text-red-600">₹{(p.deductions + (p.lopAmount || 0)).toLocaleString('en-IN')}</TableCell>
                                                <TableCell className="font-bold">₹{p.netSalary.toLocaleString('en-IN')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={p.status === 'PAID' ? 'default' : 'outline'}>
                                                        {p.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="gap-1">
                                                        <Download className="h-4 w-4" /> PDF
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
