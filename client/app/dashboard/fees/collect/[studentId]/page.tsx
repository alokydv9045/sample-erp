'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { feeAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, IndianRupee, Printer, Download, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { ReceiptPrinter, ReceiptData } from '@/components/fees/ReceiptPrinter';

export default function StudentFeeProfile({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = React.use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [studentData, setStudentData] = useState<any>(null);
    const [activeLedgerId, setActiveLedgerId] = useState<string>('');

    // Payment Form State
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('CASH');
    const [transactionId, setTransactionId] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');

    // Post-payment state
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

    const { canCollectFees } = usePermissions();
    const printRef = useRef<HTMLDivElement>(null);

    // Redirect if unauthorized
    useEffect(() => {
        if (canCollectFees === false) {
            router.push('/dashboard/fees');
        }
    }, [canCollectFees, router]);

    useEffect(() => {
        fetchStudentProfile();
    }, [studentId]);

    const fetchStudentProfile = async () => {
        setIsLoading(true);
        try {
            const data = await feeAPI.getStudentStatus(studentId);
            setStudentData(data);
            if (data.ledgers && data.ledgers.length > 0) {
                setActiveLedgerId(data.ledgers[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch student fee profile', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getActiveLedger = () => {
        if (!studentData || !studentData.ledgers) return null;
        return studentData.ledgers.find((l: any) => l.id === activeLedgerId) || studentData.ledgers[0];
    };

    // Payment Validation
    const validatePayment = (): string | null => {
        const amount = parseFloat(paymentAmount);
        const ledger = getActiveLedger();

        if (!ledger) return "No fee structure selected.";
        if (isNaN(amount) || amount <= 0) return "Please enter a valid amount greater than 0.";
        if (amount > ledger.totalPending) return `Amount cannot exceed the pending balance of ₹${ledger.totalPending.toLocaleString()}.`;
        if (paymentMode !== 'CASH' && !transactionId.trim()) return `Transaction/Reference ID is required for ${paymentMode}.`;

        return null;
    };

    const handleCollectFee = async (e: React.FormEvent) => {
        e.preventDefault();

        const errorMsg = validatePayment();
        if (errorMsg) {
            alert(errorMsg); // You can replace this with a toast notification
            return;
        }

        setIsProcessing(true);
        try {
            const activeLedger = getActiveLedger();
            const amountNum = parseFloat(paymentAmount);

            const response = await feeAPI.createPayment({
                studentId,
                ledgerId: activeLedger.id,
                amount: amountNum,
                paymentMode,
                transactionId,
                remarks,
            });

            // Prepare receipt data
            const newReceipt: ReceiptData = {
                receiptNumber: response.payment?.receiptNumber || `REC${Date.now()}`,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                student: {
                    name: `${studentData.student.user.firstName} ${studentData.student.user.lastName}`,
                    admissionNumber: studentData.student.admissionNumber,
                    class: studentData.student.currentClass?.name || 'N/A',
                    section: studentData.student.section?.name || '',
                },
                payment: {
                    amount: amountNum,
                    mode: paymentMode,
                    transactionId: transactionId || undefined,
                    feeStructureName: activeLedger.feeStructure.name,
                    remarks: remarks || undefined,
                }
            };

            setReceiptData(newReceipt);
            setShowReceipt(true);

            // Auto-refresh student profile data
            await fetchStudentProfile();

            // Reset form
            setPaymentAmount('');
            setTransactionId('');
            setRemarks('');

        } catch (err: any) {
            const serverMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to process payment.';
            alert(serverMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        // A simple, reliable printing method using an iframe or opening a new window
        // since we can't reliably install react-to-print right now
        const printContent = document.getElementById('receipt-print-area');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore React bindings after DOM massacre
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 font-medium">Loading Fee Profile...</span>
            </div>
        );
    }

    if (!studentData || !studentData.student) {
        return (
            <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-bold">Student Not Found</h2>
                <Button asChild>
                    <Link href="/dashboard/fees/collect">Back to Search</Link>
                </Button>
            </div>
        );
    }

    const { student, summary } = studentData;
    const activeLedger = getActiveLedger();

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/fees/collect">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Student Fee Profile</h1>
                    <p className="text-sm text-muted-foreground">Collect fees and view ledger history</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Student Details & Payment History */}
                <div className="md:col-span-2 space-y-6">

                    {/* Identity Card */}
                    <Card className="shadow-sm border-t-4 border-t-primary">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        {student.user.firstName} {student.user.lastName}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-2 text-sm font-medium text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-800">
                                            ID: {student.admissionNumber}
                                        </span>
                                        <span>Class {student.currentClass?.name} {student.section && `(${student.section.name})`}</span>
                                        <span>•</span>
                                        <span>Roll No: {student.rollNumber || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 text-center sm:text-right">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Paid</p>
                                        <p className="text-xl font-bold text-green-600">₹{(summary?.totalPaid || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="w-px bg-slate-200"></div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Pending</p>
                                        {/* API returns totalDue, not totalPending */}
                                        <p className="text-xl font-bold text-red-600">₹{(summary?.totalDue ?? summary?.totalPending ?? 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ledger History Tabs */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <CardTitle className="text-lg">Fee History Ledger</CardTitle>
                                <Select value={activeLedgerId} onValueChange={setActiveLedgerId}>
                                    <SelectTrigger className="w-full sm:w-[250px] bg-white">
                                        <SelectValue placeholder="Select Fee Structure" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {studentData.ledgers.map((l: any) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.feeStructure.name}
                                                {l.totalPending === 0 ? ' (Paid)' : ` (₹${l.totalPending} due)`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {activeLedger?.payments && activeLedger.payments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead>Date</TableHead>
                                                <TableHead>Receipt No</TableHead>
                                                <TableHead>Mode / Ref</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeLedger.payments.map((payment: any) => (
                                                <TableRow key={payment.id} className="hover:bg-slate-50">
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{payment.receiptNumber}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{payment.paymentMode}</span>
                                                            {payment.transactionId && (
                                                                <span className="text-xs text-slate-500 font-mono">Txn: {payment.transactionId}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-slate-700">
                                                        ₹{payment.amount.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className={payment.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                                                            {payment.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <IndianRupee className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                    <p className="font-medium text-slate-700">No payment history</p>
                                    <p className="text-sm">No transactions recorded for this ledger yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Collect Fee Action Panel */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="shadow-md border-primary/20 sticky top-6">
                        <CardHeader className="bg-primary/5 border-b pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IndianRupee className="h-5 w-5 text-primary" />
                                Collect Fee
                            </CardTitle>
                            {activeLedger && (
                                <CardDescription>
                                    For: <span className="font-semibold text-slate-800">{activeLedger.feeStructure.name}</span>
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6">

                            {activeLedger && activeLedger.totalPending === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center p-6 bg-green-50 rounded-lg border border-green-100">
                                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                                    <h3 className="text-lg font-bold text-green-800">Fully Paid</h3>
                                    <p className="text-sm text-green-600 mt-1">There is no pending balance for this fee structure.</p>
                                </div>
                            ) : activeLedger ? (
                                <form onSubmit={handleCollectFee} className="space-y-5">

                                    {/* Ledger Balances Context */}
                                    <div className="bg-slate-50 rounded-lg p-4 border flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-600">Pending Due:</span>
                                        <span className="text-xl font-bold text-red-600">₹{activeLedger.totalPending.toLocaleString()}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="font-semibold">Payment Amount *</Label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                max={activeLedger.totalPending}
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="pl-9 font-bold text-lg h-12 border-slate-300 focus-visible:ring-primary/40"
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
                                            <p className="text-xs text-slate-500 font-medium text-right mt-1">
                                                Remaining balance will be: <span className="text-slate-900">₹{Math.max(0, activeLedger.totalPending - parseFloat(paymentAmount)).toLocaleString()}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="paymentMode" className="font-semibold">Payment Mode *</Label>
                                        <Select value={paymentMode} onValueChange={setPaymentMode} disabled={isProcessing}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                                <SelectItem value="UPI">UPI / QR</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</SelectItem>
                                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                                <SelectItem value="CARD">Debit / Credit Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {paymentMode !== 'CASH' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                            <Label htmlFor="transactionId" className="font-semibold">Reference / Txn ID *</Label>
                                            <Input
                                                id="transactionId"
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                placeholder="e.g. UTR123456789"
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="remarks" className="font-semibold">Remarks (Optional)</Label>
                                        <Input
                                            id="remarks"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Add a note..."
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isProcessing || !paymentAmount}>
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Collect Payment'
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center p-6 bg-slate-50 rounded-lg">
                                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-600">No Ledgers</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Receipt Modal */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-slate-100">
                    <DialogHeader className="p-6 pb-2 bg-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <DialogTitle className="flex items-center gap-2 text-xl text-green-700">
                                    <CheckCircle2 className="h-6 w-6" />
                                    Payment Successful
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    The fee has been collected and the ledger is updated.
                                </DialogDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowReceipt(false)}>
                                    Close
                                </Button>
                                <Button onClick={handlePrint} className="gap-2">
                                    <Printer className="h-4 w-4" />
                                    Print Receipt
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 bg-slate-100 overflow-y-auto max-h-[70vh]">
                        <div id="receipt-print-area" className="bg-white shadow-xl rounded-md mx-auto max-w-[800px]">
                            {receiptData && <ReceiptPrinter data={receiptData} />}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
