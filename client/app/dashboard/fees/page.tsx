'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { feeAPI, academicAPI, paymentAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, IndianRupee, Receipt, TrendingUp, Search, Eye, Edit, Trash2, PieChart } from 'lucide-react';
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function FeesPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    summary: { totalCollected: 0, pending: 0, collectionRate: 0 },
    trend: [],
    defaulters: []
  });

  // Student List State
  const [studentsData, setStudentsData] = useState<any>({ students: [], pagination: { total: 0 } });
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [studentFilters, setStudentFilters] = useState({
    search: '',
    classId: 'all',
    sectionId: 'all',
    status: 'all',
  });
  const debouncedSearch = useDebounce(studentFilters.search, 500);

  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [payingLedgerId, setPayingLedgerId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [reportFilters, setReportFilters] = useState({
    classId: 'all',
    sectionId: 'all',
    month: 'all',
  });
  const [classReports, setClassReports] = useState<any[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);

  const fetchReportData = useCallback(async () => {
    setIsReportsLoading(true);
    try {
      const params: any = { limit: 1000 };
      if (reportFilters.classId !== 'all') params.classId = reportFilters.classId;
      if (reportFilters.sectionId !== 'all') params.sectionId = reportFilters.sectionId;
      if (reportFilters.month !== 'all') params.month = reportFilters.month;

      const res = await feeAPI.getClassWiseReport(params);
      setClassReports(res.report || []);
    } catch (err) {
      console.error('Failed to fetch report data', err);
      toast.error('Failed to load report data');
    } finally {
      setIsReportsLoading(false);
    }
  }, [reportFilters.classId, reportFilters.sectionId, reportFilters.month]);

  const { canManageFeeStructures, canCollectFees, canRegisterStudents, isStudent } = usePermissions();
  const { user } = useAuth();
  const [feeData, setFeeData] = useState<any>(null);

  const [structureForm, setStructureForm] = useState({
    name: '',
    classId: 'all',
    academicYearId: '',
    description: '',
    frequency: '',
    feeHeads: [{ headName: 'TUITION', amount: '' }]
  });

  const fetchStudentFeeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await feeAPI.getStudentStatus('me');
      if (res) {
        setFeeData(res);
      }
    } catch (err) {
      console.error('Failed to fetch student fee status', err);
      toast.error('Failed to load your fee status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        feeAPI.getStructures(),
        feeAPI.getPayments(),
        academicAPI.getClasses(),
        academicAPI.getSections(),
        academicAPI.getAcademicYears(),
        feeAPI.getStats()
      ]);

      const [structuresRes, paymentsRes, classesRes, sectionsRes, yearsRes, statsRes] = results;

      if (structuresRes.status === 'fulfilled') setStructures(structuresRes.value.structures || []);
      if (paymentsRes.status === 'fulfilled') setPayments(paymentsRes.value.payments || []);
      if (classesRes.status === 'fulfilled') setClasses(classesRes.value.classes || []);
      if (sectionsRes.status === 'fulfilled') setSections(sectionsRes.value.sections || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);

      if (yearsRes.status === 'fulfilled') {
        const yearsData = yearsRes.value;
        const years = yearsData.academicYears || [];
        setAcademicYears(years);
        if (years.length > 0) {
          const current = years.find((y: any) => y.isCurrent) || years[0];
          setStructureForm(prev => ({ ...prev, academicYearId: current.id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch fee data', err);
      toast.error('Failed to load some fee data. Refresh to retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsStudentsLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (studentFilters.classId !== 'all') params.classId = studentFilters.classId;
      if (studentFilters.sectionId !== 'all') params.sectionId = studentFilters.sectionId;
      if (studentFilters.status !== 'all') params.status = studentFilters.status;

      const res = await feeAPI.getFeeStudents(params);
      setStudentsData(res);
    } catch (err) {
      console.error('Failed to fetch students', err);
      toast.error('Failed to load students list');
    } finally {
      setIsStudentsLoading(false);
    }
  }, [debouncedSearch, studentFilters.classId, studentFilters.sectionId, studentFilters.status]);

  useEffect(() => {
    if (isStudent && user) {
      fetchStudentFeeData();
    } else {
      fetchData();

      // Background polling every 60 seconds to keep data synchronized
      const intervalId = setInterval(() => {
        fetchData();
        fetchStudents();
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [isStudent, user, fetchStudentFeeData, fetchData, fetchStudents]);

  useEffect(() => {
    if (!isStudent) {
      fetchStudents();
    }
  }, [isStudent, fetchStudents]);

  useEffect(() => {
    if (!isStudent) {
      fetchReportData();
    }
  }, [isStudent, fetchReportData]);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...structureForm,
        classId: structureForm.classId === 'all' ? null : structureForm.classId,
        feeHeads: structureForm.feeHeads.filter(h => h.amount && parseFloat(h.amount) > 0)
      };

      if (isEditing && selectedStructure) {
        await feeAPI.updateStructure(selectedStructure.id, payload);
        toast.success('Fee structure updated successfully');
      } else {
        await feeAPI.createStructure(payload);
        toast.success('Fee structure created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
      fetchStudents(); // Ensure students list is instantly synchronized
    } catch (err) {
      console.error('Failed to save fee structure', err);
      toast.error('Failed to save fee structure');
    }
  };

  const resetForm = () => {
    setStructureForm({
      name: '',
      classId: 'all',
      academicYearId: academicYears.find(y => y.isCurrent)?.id || '',
      description: '',
      frequency: '',
      feeHeads: [{ headName: 'TUITION', amount: '' }]
    });
    setIsEditing(false);
    setSelectedStructure(null);
  };

  const handleEditClick = (structure: any) => {
    setSelectedStructure(structure);
    setStructureForm({
      name: structure.name,
      classId: structure.classId || 'all',
      academicYearId: structure.academicYearId,
      description: structure.description || '',
      frequency: structure.frequency,
      feeHeads: structure.items && structure.items.length > 0
        ? structure.items.map((i: any) => ({ headName: i.headName, amount: i.amount.toString() }))
        : [{ headName: 'TUITION', amount: '' }]
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure? This will also remove associated ledgers if any.')) return;
    try {
      await feeAPI.deleteStructure(id);
      toast.success('Fee structure deleted successfully');
      fetchData();
      fetchStudents(); // Ensure students list is instantly synchronized
    } catch (err) {
      console.error('Failed to delete fee structure', err);
      toast.error('Failed to delete fee structure');
    }
  };

  const handleViewClick = (structure: any) => {
    setSelectedStructure(structure);
    setIsViewDialogOpen(true);
  };

  const getPaymentStatus = (status: string) => {
    const variants: Record<string, string> = {
      PAID: 'bg-green-100 text-green-700 w-24 text-center',
      PENDING: 'bg-orange-100 text-orange-700 w-24 text-center',
      PARTIAL: 'bg-blue-100 text-blue-700 w-24 text-center',
      OVERDUE: 'bg-red-100 text-red-700 w-24 text-center',
      'N/A': 'bg-gray-100 text-gray-500 w-24 text-center',
    };
    return variants[status] || 'bg-gray-100 text-gray-700 w-24 text-center';
  };

  const handlePayNow = async (ledger: any) => {
    if (!user) return;

    // Safety check for Razorpay script
    if (!(window as any).Razorpay) {
      toast.error('Payment system is still loading. Please wait a moment.');
      return;
    }

    setPayingLedgerId(ledger.id);
    try {
      const order = await paymentAPI.createOrder(ledger.id, ledger.totalPending);

      const options = {
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: `${process.env.NEXT_PUBLIC_SCHOOL_NAME || 'School'} Fee Payment`,
        description: `${order.feeType}`,
        order_id: order.orderId,
        prefill: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email || '',
          contact: user.phone || '',
        },
        handler: async (response: any) => {
          try {
            await paymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              ledgerId: ledger.id,
            });
            toast.success('Payment successful! Your fee has been recorded.');
            fetchStudentFeeData();
          } catch (err) {
            toast.error('Payment verification failed. Please contact admin.');
          }
        },
        theme: {
          color: process.env.NEXT_PUBLIC_BRAND_COLOR || '#2563EB',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to initiate payment';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to initiate payment');
    } finally {
      setPayingLedgerId(null);
    }
  };

  const handleDownloadStatement = async () => {
    setIsDownloading(true);
    try {
      const blob = await feeAPI.downloadStatement('me');
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FeeStatement_${user?.firstName || 'Student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Statement downloaded successfully');
    } catch (err) {
      console.error('Failed to download statement', err);
      toast.error('Failed to download statement');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 uppercase text-[10px] px-2 h-5">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 uppercase text-[10px] px-2 h-5">Partial</Badge>;
      case 'PENDING':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 uppercase text-[10px] px-2 h-5">Pending</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[10px] px-2 h-5">{status}</Badge>;
    }
  };

  if (isStudent) {
    if (isLoading && !feeData) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!feeData || !feeData.ledgers || feeData.ledgers.length === 0) {
      return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Fees</h1>
            <p className="text-muted-foreground">View your fee status and payment history</p>
          </div>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <IndianRupee className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p className="font-medium">No fee records found</p>
              <p className="text-sm">Fee structures haven&apos;t been assigned to your account yet.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const summary = feeData.summary || { totalFees: 0, totalPaid: 0, totalDue: 0 };
    const collectionPercent = summary.totalFees > 0
      ? Math.round((summary.totalPaid / summary.totalFees) * 100)
      : 0;

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Overview</h1>
          <p className="text-muted-foreground">Manage your school fee payments and receipts</p>
        </div>

        {/* Finance Overview Summary Card */}
        <Card className="overflow-hidden shadow-sm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              Statement Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6 sm:grid-cols-3 mb-6">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Total Fees (Year)</p>
                <p className="text-3xl font-bold">{formatCurrency(summary.totalFees)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Outstanding Due</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(summary.totalDue)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Payment Progress</span>
                <span className="font-medium text-primary">{collectionPercent}% Completed</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${collectionPercent}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Fee Breakdown Table */}
          <Card className="md:col-span-8 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Fee Ledger</CardTitle>
              <CardDescription>Breakdown by fee structure items</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium py-3 px-4">Fee Structure</th>
                      <th className="text-right font-medium py-3 px-4">Total</th>
                      <th className="text-right font-medium py-3 px-4">Paid</th>
                      <th className="text-right font-medium py-3 px-4">Due</th>
                      <th className="text-center font-medium py-3 px-4">Status</th>
                      <th className="text-right font-medium py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {feeData.ledgers.map((ledger: any) => (
                      <tr key={ledger.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-medium">{ledger.feeStructure?.name || 'Fee'}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {ledger.feeStructure?.items?.[0]?.headName?.replace('_', ' ') || 'GENERAL'}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(ledger.totalPayable)}</td>
                        <td className="py-4 px-4 text-right text-green-600 font-medium">{formatCurrency(ledger.totalPaid)}</td>
                        <td className="py-4 px-4 text-right text-red-600 font-medium">{formatCurrency(ledger.totalPending)}</td>
                        <td className="py-4 px-4 text-center">
                          {getStatusBadge(ledger.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {ledger.totalPending > 0 ? (
                            <Button
                              size="sm"
                              className="h-8 px-3"
                              onClick={() => handlePayNow(ledger)}
                              disabled={payingLedgerId === ledger.id}
                            >
                              {payingLedgerId === ledger.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Pay Now'
                              )}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              SETTLED
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent History Sidebar */}
          <Card className="md:col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent History</CardTitle>
              <CardDescription>Last 5 transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeData.recentPayments && feeData.recentPayments.length > 0 ? (
                feeData.recentPayments.map((p: any) => (
                  <div key={p.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/20 relative overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm">{formatCurrency(p.amount)}</span>
                      <Badge variant="outline" className="text-[9px] uppercase h-4 px-1">
                        {p.paymentMode || p.paymentMethod || 'CASH'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</span>
                      <span className="font-mono text-[9px] truncate ml-2 max-w-[80px]" title={p.receiptNumber}>#{p.receiptNumber}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                  <IndianRupee className="h-8 w-8 opacity-20 mb-2" />
                  <p className="text-sm">No transaction history</p>
                </div>
              )}
              <Button 
                variant="ghost" 
                className="w-full text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                onClick={handleDownloadStatement}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Receipt className="h-3 w-3 mr-2" />
                )}
                Download Statement (PDF)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground">Manage fee structures and payments</p>
        </div>
        <div className="flex gap-2">
          {canCollectFees && (
            <Button asChild>
              <Link href="/dashboard/fees/collect">
                <Receipt className="mr-2 h-4 w-4" />
                Collect Fee
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ── Students List Tab ── */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Students Directory</CardTitle>
              <CardDescription>Search for students to view ledgers and collect fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, roll no, admission no..."
                    className="pl-9"
                    value={studentFilters.search}
                    onChange={(e) => setStudentFilters(f => ({ ...f, search: e.target.value }))}
                  />
                </div>
                <Select
                  value={studentFilters.classId}
                  onValueChange={(val) => setStudentFilters(f => ({ ...f, classId: val }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={studentFilters.sectionId}
                  onValueChange={(val) => setStudentFilters(f => ({ ...f, sectionId: val }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={studentFilters.status}
                  onValueChange={(val) => setStudentFilters(f => ({ ...f, status: val }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Any Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending (or Partial)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isStudentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : studentsData.students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No students found matching your filters.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Total Payable</TableHead>
                        <TableHead className="text-right text-blue-600">Total Paid</TableHead>
                        <TableHead className="text-right">Pending Balance</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsData.students.map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium text-xs">{student.admissionNumber}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {student.className} {student.sectionName !== 'N/A' && `(${student.sectionName})`}
                          </TableCell>
                          <TableCell className="text-right">₹{student.totalPayable.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium text-blue-600">₹{(student.totalPaid || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            ₹{student.totalPending.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`justify-center ${getPaymentStatus(student.feeStatus)}`}>
                              {student.feeStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {canCollectFees && student.totalPending > 0 && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                <Link href="/dashboard/fees/collect">Collect</Link>
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
        </TabsContent>

        {/* ── Fee Structures Tab ── */}
        <TabsContent value="structures" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Fee Structures</CardTitle>
                  <CardDescription>Define fee structures for different classes</CardDescription>
                </div>
                {canManageFeeStructures && (
                  <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Structure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
                        <DialogDescription>
                          {isEditing ? 'Update the existing fee structure details' : 'Create a new fee structure configuration'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateStructure} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Structure Name *</Label>
                          <Input
                            id="name"
                            value={structureForm.name}
                            onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                            placeholder="e.g., Tuition Fee - Grade 10"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="academicYearId">Academic Year *</Label>
                          <Select
                            value={structureForm.academicYearId}
                            onValueChange={(val) => setStructureForm({ ...structureForm, academicYearId: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Academic Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {academicYears.map((y) => (
                                <SelectItem key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Current)' : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label>Fee Heads (Items)</Label>
                          {structureForm.feeHeads.map((head, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Select
                                value={head.headName}
                                onValueChange={(val) => {
                                  const newHeads = [...structureForm.feeHeads];
                                  newHeads[index].headName = val;
                                  setStructureForm({ ...structureForm, feeHeads: newHeads });
                                }}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TUITION">Tuition</SelectItem>
                                  <SelectItem value="EXAM">Exam</SelectItem>
                                  <SelectItem value="TRANSPORT">Transport</SelectItem>
                                  <SelectItem value="LATE_FEE">Late Fee</SelectItem>
                                  <SelectItem value="MISC">Misc</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={head.amount}
                                onChange={(e) => {
                                  const newHeads = [...structureForm.feeHeads];
                                  newHeads[index].amount = e.target.value;
                                  setStructureForm({ ...structureForm, feeHeads: newHeads });
                                }}
                                className="flex-1"
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setStructureForm({ ...structureForm, feeHeads: [...structureForm.feeHeads, { headName: 'MISC', amount: '' }] })}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Head
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="frequency">Frequency *</Label>
                          <Select
                            value={structureForm.frequency}
                            onValueChange={(val) => setStructureForm({ ...structureForm, frequency: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                              <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                              <SelectItem value="YEARLY">Yearly</SelectItem>
                              <SelectItem value="ONE_TIME">One Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="classId">Class (Optional)</Label>
                          <Select
                            value={structureForm.classId}
                            onValueChange={(val) => setStructureForm({ ...structureForm, classId: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Apply to all classes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Classes</SelectItem>
                              {classes
                                .filter(c => !structureForm.academicYearId || c.academicYearId === structureForm.academicYearId)
                                .map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={structureForm.description}
                            onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                            placeholder="Optional description"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {isEditing ? 'Update Structure' : 'Create Structure'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {structures.map((structure) => (
                        <TableRow key={structure.id}>
                          <TableCell className="font-medium">{structure.name}</TableCell>
                          <TableCell>₹{structure.amount?.toLocaleString()}</TableCell>
                          <TableCell className="text-xs uppercase font-semibold text-muted-foreground">
                            {structure.frequency}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600"
                                onClick={() => handleViewClick(structure)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManageFeeStructures && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-600"
                                    onClick={() => handleEditClick(structure)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600"
                                    onClick={() => handleDeleteClick(structure.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
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

          {/* View Structure Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Fee Structure Details</DialogTitle>
                <DialogDescription>Full breakdown of the selected fee structure</DialogDescription>
              </DialogHeader>
              {selectedStructure && (
                <div className="space-y-4 pt-2">
                  <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Structure Name</p>
                      <p className="font-semibold">{selectedStructure.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Frequency</p>
                      <Badge variant="outline" className="mt-1">{selectedStructure.frequency}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Total Amount</p>
                      <p className="text-xl font-bold text-primary">
                        ₹{(selectedStructure.amount || selectedStructure.totalAmount)?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Class</p>
                      <p>{classes.find(c => c.id === selectedStructure.classId)?.name || 'All Classes'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Fee Breakdown</p>
                    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                      {selectedStructure.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground uppercase text-[10px] font-bold">{item.headName}</span>
                          <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedStructure.description && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Description</p>
                      <p className="text-sm text-muted-foreground italic">"{selectedStructure.description}"</p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Payments Tab ── */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>View all fee payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.receiptNumber || payment.id}</TableCell>
                          <TableCell>{payment.student?.user?.firstName || 'N/A'}</TableCell>
                          <TableCell>₹{payment.amount?.toLocaleString()}</TableCell>
                          <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={getPaymentStatus(payment.status || 'PAID').replace('w-24 text-center', '')}>
                              {payment.status || 'PAID'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Reports Tab ── */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{stats.summary?.totalCollected?.toLocaleString() || '0'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">This month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">
                    ₹{stats.summary?.pending?.toLocaleString() || '0'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Due this month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
                  <p className="text-3xl font-bold">{stats.summary?.collectionRate || 0}%</p>
                  <p className="mt-2 text-xs text-muted-foreground">Current month</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <RealtimeChart
              title="Income Trend"
              description="Monthly fee collection vs target"
              endpoint="/dashboard/finance-stats"
              socketEvent="FINANCE_UPDATE"
              type="area"
              dataKey="actual"
              xAxisKey="month"
              color="#22c55e"
            />
            <RealtimeChart
              title="Collection Breakdown"
              description="Payment method distribution"
              endpoint="/dashboard/finance-stats"
              socketEvent="FINANCE_UPDATE"
              type="pie"
              dataKey="value"
              xAxisKey="name"
              colors={["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"]}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Top Defaulters</CardTitle>
              <CardDescription>Students with the highest pending fee balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Pending Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.defaulters && stats.defaulters.length > 0 ? (
                      stats.defaulters.map((defaulter: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{defaulter.name}</TableCell>
                          <TableCell>{defaulter.class}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            ₹{defaulter.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No defaulters found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="h-px bg-border my-6" />

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Class & Section Filtered Reports</CardTitle>
              <CardDescription>Select filters to view and export class/section-wise fee details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Class</Label>
                  <Select
                    value={reportFilters.classId}
                    onValueChange={(val) => setReportFilters(f => ({ ...f, classId: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Section</Label>
                  <Select
                    value={reportFilters.sectionId}
                    onValueChange={(val) => setReportFilters(f => ({ ...f, sectionId: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Month (Optional)</Label>
                  <Select
                    value={reportFilters.month}
                    onValueChange={(val) => setReportFilters(f => ({ ...f, month: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={fetchReportData} disabled={isReportsLoading} className="h-10">
                    {isReportsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!classReports || classReports.length === 0) {
                        toast.error('No data available to export');
                        return;
                      }

                      const headers = ['Class Name', 'Total Students', 'Paid Students', 'Pending Students', 'Total Collection', 'Balance Due'];
                      const rows = classReports.map(c => [
                        `"${c.className}"`,
                        c.totalStudents,
                        c.paidStudentsCount,
                        c.pendingStudentsCount,
                        c.totalCollection,
                        c.totalPending
                      ]);

                      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', `Class_Wise_Fee_Report.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success('Fee report exported successfully');
                    }}
                    className="h-10 text-xs border-green-600 text-green-700 hover:bg-green-50"
                  >
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics summary specifically for the filtered reports */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtered Total Collection</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    ₹{classReports.reduce((sum, c) => sum + (c.totalCollection || 0), 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Amount collected</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtered Total Pending</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    ₹{classReports.reduce((sum, c) => sum + (c.totalPending || 0), 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Amount due</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {classReports.reduce((sum, c) => sum + (c.totalStudents || 0), 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">In selected classes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Class-wise Report</CardTitle>
              <CardDescription>Collection statistics aggregated by class</CardDescription>
            </CardHeader>
            <CardContent>
              {isReportsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : classReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                  No fee records found matching these filters.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold text-xs">Class</TableHead>
                        <TableHead className="font-semibold text-xs text-center">Total Students</TableHead>
                        <TableHead className="text-center font-semibold text-xs text-green-600">Paid Fully</TableHead>
                        <TableHead className="text-center font-semibold text-xs text-red-600">Pending</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-green-600">Collection (₹)</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-red-600">Balance (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classReports.map((c: any) => (
                        <TableRow key={c.classId} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium text-sm">{c.className}</TableCell>
                          <TableCell className="font-mono text-xs text-center">{c.totalStudents}</TableCell>
                          <TableCell className="text-xs text-center font-medium text-green-600">
                            {c.paidStudentsCount}
                          </TableCell>
                          <TableCell className="text-xs text-center font-bold text-red-600">
                            {c.pendingStudentsCount}
                          </TableCell>
                          <TableCell className="text-right font-medium text-sm text-green-600">₹{(c.totalCollection || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-sm text-red-600">₹{(c.totalPending || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
