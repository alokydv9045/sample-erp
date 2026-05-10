'use client';

import Link from 'next/link';

import { useState, useEffect, useCallback } from 'react';
import { hrAPI, payrollAPI, attendanceAPI, serviceAPI, academicAPI, scannerAPI } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';
import {
    CheckCircle, Clock, Calendar, UserCheck,
    FileText, UserX, UserPlus, Briefcase,
    IndianRupee, ChevronLeft, ChevronRight, RefreshCw, Eye,
    Download, FileSpreadsheet, Loader2, Users, Plus, Search, Edit, BarChart
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

const selectCls =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

const ROLES_STAFF = ['LIBRARIAN', 'ACCOUNTANT', 'ADMIN'];
const ALL_ROLES = ['TEACHER', 'LIBRARIAN', 'ACCOUNTANT', 'ADMIN'];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const emptyForm = {
    firstName: '', lastName: '', email: '', password: '', phone: '',
    role: 'TEACHER', joiningDate: '',
    // Teacher
    qualification: '', experience: '', specialization: '',
    // Staff
    designation: '', department: '',
    assignedScannerId: '',
};

export default function HRManagementPage() {
    const { socket } = useSocket();
    const {
        isAdmin, isSuperAdmin, isHRManager, isPrincipal, isHOD,
        canManageHR, canApproveLeaves, canConductReviews, canViewPayroll
    } = usePermissions();
    const now = new Date();

    // ── Employees ─────────────────────────────────────────────────────────
    const [employees, setEmployees] = useState<any[]>([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // ── Employee Dialog ───────────────────────────────────────────────────
    const [empDialog, setEmpDialog] = useState(false);
    const [editingEmp, setEditingEmp] = useState<any>(null);
    const [empForm, setEmpForm] = useState({ ...emptyForm });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Salary Structure Dialog ───────────────────────────────────────────
    const [salaryDialog, setSalaryDialog] = useState(false);
    const [salaryEmp, setSalaryEmp] = useState<any>(null);
    const [salaryForm, setSalaryForm] = useState({ basicSalary: '', allowances: '0', deductions: '0' });
    const [isSalarySubmitting, setIsSalarySubmitting] = useState(false);

    // ── Payroll ───────────────────────────────────────────────────────────
    const [payMonth, setPayMonth] = useState(now.getMonth() + 1);
    const [payYear, setPayYear] = useState(now.getFullYear());
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [payrollSummary, setPayrollSummary] = useState<any>(null);
    const [isPayrollLoading, setIsPayrollLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // ── Staff Attendance ──────────────────────────────────────────────────
    const [attDate, setAttDate] = useState(now.toISOString().split('T')[0]);
    const [attType, setAttType] = useState<'TEACHER' | 'STAFF'>('TEACHER');
    const [attList, setAttList] = useState<any[]>([]);
    const [isAttLoading, setIsAttLoading] = useState(false);
    const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);

    // ── Leaves ───────────────────────────────────────────────────────────
    const [leaves, setLeaves] = useState<any[]>([]);
    const [isLeavesLoading, setIsLeavesLoading] = useState(false);
    const [leaveProcessDialog, setLeaveProcessDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [processRemarks, setProcessRemarks] = useState('');

    // Derived: Staff on leave today
    const onLeaveToday = (leaves || []).filter(l => {
        const d = new Date(attDate);
        return l.status === 'APPROVED' && new Date(l.startDate) <= d && new Date(l.endDate) >= d;
    });

    // ── Performance Review ───────────────────────────────────────────────
    const [reviewDialog, setReviewDialog] = useState(false);
    const [reviewEmp, setReviewEmp] = useState<any>(null);
    const [reviewForm, setReviewForm] = useState({
        periodStart: '', periodEnd: '',
        ratings: { academic: 5, discipline: 5, punctuality: 5 },
        strengths: '', improvements: '', comments: ''
    });
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

    // ── Leave Calendar ──────────────────────────────────────────────────
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();

    const getLeavesForDay = (day: number) => {
        const d = new Date(viewYear, viewMonth - 1, day);
        return (leaves || []).filter(l =>
            l.status === 'APPROVED' &&
            new Date(l.startDate) <= d &&
            new Date(l.endDate) >= d
        );
    };

    // ── Fetch employees ───────────────────────────────────────────────────
    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await hrAPI.getEmployees({
                search: search || undefined,
                type: typeFilter || undefined,
                status: statusFilter || undefined,
            });
            setEmployees(data.employees || []);
            setTotalEmployees(data.pagination?.total || 0);
        } catch {
            toast.error('Failed to load employees');
        } finally {
            setIsLoading(false);
        }
    }, [search, typeFilter, statusFilter]);

    const [scanners, setScanners] = useState<any[]>([]);

    const fetchScanners = useCallback(async () => {
        try {
            const data = await scannerAPI.getAll();
            setScanners(data.scanners || []);
        } catch {
            console.error('Failed to load scanners');
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchScanners();
    }, [fetchEmployees, fetchScanners]);

    // ── Fetch payroll ─────────────────────────────────────────────────────
    const fetchPayroll = useCallback(async () => {
        setIsPayrollLoading(true);
        try {
            const data = await payrollAPI.getPayrollList(payMonth, payYear);
            setPayrolls(data.payrolls || []);
            setPayrollSummary(data.summary || null);
        } catch {
            setPayrolls([]);
            setPayrollSummary(null);
        } finally {
            setIsPayrollLoading(false);
        }
    }, [payMonth, payYear]);

    useEffect(() => {
        fetchPayroll();
    }, [fetchPayroll]);

    // ── Employee dialog helpers ───────────────────────────────────────────
    const openCreate = () => {
        setEditingEmp(null);
        setEmpForm({ ...emptyForm });
        setEmpDialog(true);
    };

    const openEdit = (emp: any) => {
        setEditingEmp(emp);
        const tOrS = emp.teacher || emp.staff;
        setEmpForm({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            password: '',
            phone: emp.phone || '',
            role: emp.role || 'TEACHER',
            joiningDate: tOrS?.joiningDate ? tOrS.joiningDate.split('T')[0] : '',
            qualification: emp.teacher?.qualification || '',
            experience: emp.teacher?.experience?.toString() || '',
            specialization: emp.teacher?.specialization || '',
            designation: emp.staff?.designation || '',
            department: emp.staff?.department || '',
            assignedScannerId: (emp.teacher?.assignedScannerId || emp.staff?.assignedScannerId) || '',
        });
        setEmpDialog(true);
    };

    const handleSubmitEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEmp) {
                await hrAPI.updateEmployee(editingEmp.id, empForm);
                toast.success('Employee updated successfully');
            } else {
                await hrAPI.createEmployee(empForm);
                toast.success('Employee created successfully');
            }
            setEmpDialog(false);
            fetchEmployees();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (emp: any) => {
        const newActive = !emp.isActive;
        try {
            await hrAPI.toggleStatus(emp.id, {
                isActive: newActive,
                status: newActive ? 'ACTIVE' : 'RESIGNED',
            });
            toast.success(`Employee ${newActive ? 'activated' : 'deactivated'}`);
            fetchEmployees();
        } catch {
            toast.error('Status update failed');
        }
    };

    // ── Salary structure helpers ──────────────────────────────────────────
    const openSalaryDialog = (emp: any) => {
        setSalaryEmp(emp);
        setSalaryForm({
            basicSalary: emp.salaryStructure?.basicSalary?.toString() || '',
            allowances: emp.salaryStructure?.allowances?.toString() || '0',
            deductions: '0',
        });
        setSalaryDialog(true);
    };

    const handleSaveSalary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!salaryEmp) return;
        setIsSalarySubmitting(true);
        try {
            await payrollAPI.setSalaryStructure({
                employeeId: salaryEmp.id,
                basicSalary: parseFloat(salaryForm.basicSalary),
                allowances: parseFloat(salaryForm.allowances),
                deductions: parseFloat(salaryForm.deductions),
            });
            toast.success('Salary structure saved');
            setSalaryDialog(false);
            fetchEmployees();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save salary');
        } finally {
            setIsSalarySubmitting(false);
        }
    };

    // ── Payroll helpers ───────────────────────────────────────────────────
    const handleGeneratePayroll = async () => {
        setIsGenerating(true);
        try {
            const data = await payrollAPI.generatePayroll(payMonth, payYear);
            toast.success(data.message || 'Payroll generated');
            fetchPayroll();
        } catch (err: any) {
            const errMsg = err?.response?.data?.message ||
                (typeof err?.response?.data?.error === 'string' ? err?.response?.data?.error : null) ||
                err?.message ||
                "Failed to generate payroll";
            toast.error(errMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMarkPaid = async (payrollId: string) => {
        try {
            await payrollAPI.markPaid(payrollId);
            toast.success('Marked as paid');
            fetchPayroll();
        } catch {
            toast.error('Failed to mark as paid');
        }
    };

    // ── Attendance Handlers ──────────────────────────────────────────────
    const fetchStaffForAttendance = useCallback(async () => {
        try {
            setIsAttLoading(true);
            setIsAlreadyMarked(false);

            // Fetch active staff/teachers
            const response = await hrAPI.getEmployees({ type: attType, status: 'ACTIVE' });
            const employees = response.employees || [];

            // Fetch existing attendance for this date
            const attResponse = await attendanceAPI.getRecords({
                date: attDate,
                attendeeType: attType
            });

            const existingMap = new Map();
            if (attResponse.attendance) {
                attResponse.attendance.forEach((r: any) => {
                    const existingRecord = r.attendance;
                    const entityId = attType === 'TEACHER' ? existingRecord?.teacherId : existingRecord?.staffId;
                    if (entityId) existingMap.set(entityId, existingRecord?.status);
                });
            }

            const list = employees.map((e: any) => {
                const existingStatus = existingMap.get(e.id);
                return {
                    id: e.id,
                    name: `${e.firstName} ${e.lastName}`,
                    employeeId: getEmployeeId(e),
                    status: existingStatus || null
                };
            });

            setAttList(list);
            if (attResponse.isMarked || (attResponse.stats && attResponse.stats.marked > 0)) {
                setIsAlreadyMarked(true);
            }
        } catch (error) {
            console.error('Error fetching staff attendance:', error);
            toast.error('Failed to fetch staff list');
        } finally {
            setIsAttLoading(false);
        }
    }, [attType, attDate]);

    useEffect(() => {
        fetchStaffForAttendance();
    }, [fetchStaffForAttendance]);

    const handleAttendanceChange = (id: string, status: string) => {
        setAttList(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    const submitAttendance = async () => {
        try {
            // Validate all staff are marked
            const unmarked = attList.filter(item => !item.status);
            if (unmarked.length > 0) {
                toast({
                    title: 'Incomplete Attendance',
                    description: `Please mark attendance for all ${unmarked.length} remaining staff members.`,
                    variant: 'destructive',
                });
                return;
            }

            setIsAttLoading(true);
            const payload = {
                date: attDate,
                attendeeType: attType,
                attendanceData: attList.map(item => ({
                    userId: item.id,
                    status: item.status,
                    remarks: ''
                }))
            };
            await attendanceAPI.submitStaffAttendance(payload);
            setIsAlreadyMarked(true);
            toast.success('Attendance submitted successfully');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to submit attendance');
        } finally {
            setIsAttLoading(false);
        }
    };

    // ── Leave Handlers ───────────────────────────────────────────────────
    const fetchLeaves = useCallback(async () => {
        setIsLeavesLoading(true);
        try {
            const data = await serviceAPI.getAll({ type: 'LEAVE' });
            setLeaves(data || []);
        } catch {
            toast.error('Failed to fetch leave requests');
        } finally {
            setIsLeavesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    useEffect(() => {
        if (socket) {
            const handlePayrollUpdate = () => {
                // Refresh data on socket updates
                fetchPayroll();
            };
            const handleEmployeeUpdate = () => {
                fetchEmployees();
            };
            const handleAttendanceUpdate = () => {
                fetchStaffForAttendance();
            };

            socket.on('PAYROLL_GENERATED', handlePayrollUpdate);
            socket.on('PAYROLL_PAID', handlePayrollUpdate);
            socket.on('PAYROLL_UPDATED', handlePayrollUpdate);
            socket.on('HR_UPDATE', handleEmployeeUpdate);
            socket.on('ATTENDANCE_MARKED', handleAttendanceUpdate);

            return () => {
                socket.off('PAYROLL_GENERATED', handlePayrollUpdate);
                socket.off('PAYROLL_PAID', handlePayrollUpdate);
                socket.off('PAYROLL_UPDATED', handlePayrollUpdate);
                socket.off('HR_UPDATE', handleEmployeeUpdate);
                socket.off('ATTENDANCE_MARKED', handleAttendanceUpdate);
            };
        }
    }, [socket, fetchPayroll, fetchEmployees, fetchStaffForAttendance]);

    const processLeaveRequest = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedLeave) return;
        try {
            await hrAPI.processLeave(selectedLeave.id, { status, remarks: processRemarks });
            toast.success(`Leave request ${status.toLowerCase()}`);
            setLeaveProcessDialog(false);
            fetchLeaves();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to process leave');
        }
    };

    // ── Review Handlers ──────────────────────────────────────────────────
    const openReviewDialog = (emp: any) => {
        setReviewEmp(emp);
        setReviewForm({
            periodStart: '', periodEnd: '',
            ratings: { academic: 5, discipline: 5, punctuality: 5 },
            strengths: '', improvements: '', comments: ''
        });
        setReviewDialog(true);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewEmp) return;
        setIsReviewSubmitting(true);
        try {
            await hrAPI.createReview({
                employeeId: reviewEmp.id,
                ...reviewForm
            });
            toast.success('Performance review submitted');
            setReviewDialog(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to submit review');
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    const downloadPayrollCSV = () => {
        if (payrolls.length === 0) return;
        const headers = ['Employee', 'Employee ID', 'Role', 'Basic Salary', 'Allowances', 'Deductions', 'LOP Amount', 'Net Salary', 'Status', 'Paid At'];
        const rows = payrolls.map(p => [
            `${p.employee?.firstName} ${p.employee?.lastName}`,
            p.employee?.teacher?.employeeId || p.employee?.staff?.employeeId || p.employee?.id,
            p.employee?.role,
            p.basicSalary,
            p.allowances,
            p.deductions,
            p.lopAmount || 0,
            p.netSalary,
            p.status,
            p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `payroll_${MONTHS[payMonth - 1]}_${payYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Helpers ───────────────────────────────────────────────────────────
    const getEmployeeId = (emp: any) =>
        emp.teacher?.employeeId || emp.staff?.employeeId || `USR-${emp.id?.slice(-5).toUpperCase()}`;

    const getDesignation = (emp: any) => {
        if (emp.teacher) return `Teacher${emp.teacher.specialization ? ` (${emp.teacher.specialization})` : ''}`;
        if (emp.staff) return emp.staff.designation || emp.role;
        // No linked teacher/staff — show roles
        const allRoles: string[] = emp.roles?.length ? emp.roles : [emp.role];
        return allRoles.join(' / ');
    };

    const getDept = (emp: any) =>
        emp.staff?.department || emp.teacher?.subjects?.map((s: any) => s.subject?.name).join(', ') || '—';

    if (!canManageHR && !isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Access denied. HR management requires Admin privileges.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
                <p className="text-muted-foreground">Manage employees, salaries, and payroll</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Total Employees</p>
                        <p className="text-3xl font-bold">{totalEmployees}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-3xl font-bold text-green-600">
                            {employees.filter((e) => e.isActive).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Teachers</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {employees.filter((e) => e.role === 'TEACHER').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Staff</p>
                        <p className="text-3xl font-bold text-purple-600">
                            {employees.filter((e) => e.role !== 'TEACHER').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="employees">
                <TabsList>
                    <TabsTrigger value="employees">
                        <Users className="mr-2 h-4 w-4" /> Employees
                    </TabsTrigger>
                    <TabsTrigger value="attendance">
                        <CheckCircle className="mr-2 h-4 w-4" /> Attendance
                    </TabsTrigger>
                    <TabsTrigger value="leaves">
                        <Clock className="mr-2 h-4 w-4" /> Leaves
                    </TabsTrigger>
                    <TabsTrigger value="payroll">
                        <IndianRupee className="mr-2 h-4 w-4" /> Payroll
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart className="mr-2 h-4 w-4" /> Analytics
                    </TabsTrigger>
                </TabsList>

                {/* ── Analytics Tab ── */}
                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <RealtimeChart
                            title="Staff Attendance Trend"
                            description="Daily attendance percentage (last 7 days)"
                            endpoint="/dashboard/hr-stats"
                            socketEvent="HR_UPDATE"
                            type="area"
                            dataKey="percentage"
                            xAxisKey="day"
                            color="#8b5cf6"
                        />
                        <RealtimeChart
                            title="Leave Type Distribution"
                            description="Breakdown of recent leave requests"
                            endpoint="/dashboard/hr-stats"
                            socketEvent="LEAVE_UPDATE"
                            type="pie"
                            dataKey="value"
                            xAxisKey="name"
                            colors={["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
                        />
                    </div>
                    <div className="grid gap-6 md:grid-cols-1">
                         <RealtimeChart
                            title="Staff Count by Role"
                            description="Teacher vs non-teaching staff distribution"
                            endpoint="/dashboard/hr-stats"
                            socketEvent="HR_UPDATE"
                            type="bar"
                            dataKey="count"
                            xAxisKey="role"
                            color="#3b82f6"
                        />
                    </div>
                </TabsContent>

                {/* ── Employees Tab ── */}
                <TabsContent value="employees" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Employee Directory</CardTitle>
                                    <CardDescription>All teachers and non-teaching staff</CardDescription>
                                </div>
                                <Button onClick={openCreate}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, employee ID…"
                                        className="pl-9"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <select className={`${selectCls} w-40`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                    <option value="">All Types</option>
                                    <option value="TEACHER">Teachers</option>
                                    <option value="STAFF">Staff</option>
                                </select>
                                <select className={`${selectCls} w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">Any Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>

                            {/* Table */}
                            {isLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg">
                                    <Briefcase className="h-10 w-10 mb-3 opacity-30" />
                                    <p>No employees found. Add your first employee to get started.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Designation</TableHead>
                                                <TableHead>Scanner</TableHead>
                                                <TableHead>Salary</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employees.map((emp) => (
                                                <TableRow key={emp.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                                {emp.firstName[0]}{emp.lastName[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-mono text-muted-foreground">
                                                        {getEmployeeId(emp)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(emp.roles?.length ? emp.roles : [emp.role]).map((r: string) => (
                                                                <Badge key={r} variant="outline" className="text-xs uppercase">{r}</Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{getDesignation(emp)}</TableCell>
                                                    <TableCell>
                                                        {(emp.teacher?.assignedScanner?.name || emp.staff?.assignedScanner?.name) ? (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                {emp.teacher?.assignedScanner?.name || emp.staff?.assignedScanner?.name}
                                                            </Badge>
                                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {emp.salaryStructure
                                                            ? `₹${emp.salaryStructure.grossSalary.toLocaleString('en-IN')}`
                                                            : <span className="text-xs text-muted-foreground italic">Not set</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={emp.isActive
                                                            ? 'bg-green-100 text-green-700 border-green-200'
                                                            : 'bg-red-100 text-red-700 border-red-200'}>
                                                            {emp.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="sm" asChild title="View Profile">
                                                                <Link href={`/dashboard/users/${emp.userId || emp.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            {canManageHR && (
                                                                <>
                                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(emp)} title="Edit">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => openSalaryDialog(emp)} title="Set Salary">
                                                                        <IndianRupee className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {canConductReviews && (
                                                                <Button variant="ghost" size="sm" onClick={() => openReviewDialog(emp)} title="Performance Review">
                                                                    <UserCheck className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {canManageHR && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleToggleStatus(emp)}
                                                                    title={emp.isActive ? 'Deactivate' : 'Activate'}
                                                                    className={emp.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                                                                >
                                                                    {emp.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                                </Button>
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
                </TabsContent>

                {/* ── Attendance Tab ── */}
                <TabsContent value="attendance" className="space-y-4">
                    {onLeaveToday.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/30">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                    Staff on Approved Leave Today ({onLeaveToday.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                                <div className="flex flex-wrap gap-2">
                                    {onLeaveToday.map(l => (
                                        <Badge key={l.id} variant="outline" className="bg-background">
                                            {l.requester?.firstName} {l.requester?.lastName} ({l.subject})
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Staff Attendance</CardTitle>
                                    <CardDescription>Mark attendance for teachers and staff</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="w-40" disabled={isAttLoading} />
                                    <select
                                        className={`${selectCls} w-32`}
                                        value={attType}
                                        onChange={e => setAttType(e.target.value as any)}
                                        disabled={isAttLoading}
                                    >
                                        <option value="TEACHER">Teachers</option>
                                        <option value="STAFF">Staff</option>
                                    </select>
                                    {isAlreadyMarked ? (
                                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-md border border-green-200">
                                            <CheckCircle className="h-4 w-4" />
                                            <span className="text-xs font-semibold">SUBMITTED</span>
                                        </div>
                                    ) : (
                                        <Button onClick={submitAttendance} disabled={isAttLoading || attList.length === 0}>
                                            {isAttLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                            Save Attendance
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Attendance Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attList.map(item => (
                                            <TableRow key={item.id} className={!item.status ? 'bg-amber-50/20' : ''}>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                    {!item.status && <span className="ml-2 text-[10px] text-amber-600 font-medium italic">* Mark Required</span>}
                                                </TableCell>
                                                <TableCell className="text-sm font-mono">{item.employeeId}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {['PRESENT', 'ABSENT', 'LATE'].map(s => (
                                                            <Button
                                                                key={s}
                                                                size="sm"
                                                                variant={item.status === s ? 'default' : 'outline'}
                                                                className={item.status === s ? (s === 'PRESENT' ? 'bg-green-600 hover:bg-green-700' : s === 'ABSENT' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700') : 'hover:bg-muted'}
                                                                onClick={() => !isAlreadyMarked && handleAttendanceChange(item.id, s)}
                                                                disabled={isAlreadyMarked}
                                                            >
                                                                {s}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Leaves Tab ── */}
                <TabsContent value="leaves" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                            <div>
                                <CardTitle>Leave Calendar</CardTitle>
                                <CardDescription>Overview of approved staff leaves for {MONTHS[viewMonth - 1]} {viewYear}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
                                    else setViewMonth(m => m - 1);
                                }}><ChevronLeft className="h-4 w-4" /></Button>
                                <Badge variant="secondary" className="px-3 py-1">{MONTHS[viewMonth - 1]} {viewYear}</Badge>
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
                                    else setViewMonth(m => m + 1);
                                }}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-1">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-xs font-semibold py-2 text-muted-foreground uppercase">{d}</div>
                                ))}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-16 rounded-md bg-muted/20" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dayLeaves = getLeavesForDay(day);
                                    return (
                                        <div key={day} className="h-16 p-1 border rounded-md relative hover:bg-muted/30 transition-colors">
                                            <span className="text-xs font-medium text-muted-foreground">{day}</span>
                                            <div className="mt-1 flex flex-col gap-0.5">
                                                {dayLeaves.map(l => (
                                                    <div key={l.id} className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-800 rounded truncate" title={`${l.requester?.firstName} ${l.requester?.lastName}`}>
                                                        {l.requester?.firstName}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Leave Requests</CardTitle>
                            <CardDescription>Pending and processed leave applications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Requester</TableHead>
                                            <TableHead>Type/Subject</TableHead>
                                            <TableHead>Dates</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaves.map(l => (
                                            <TableRow key={l.id}>
                                                <TableCell>
                                                    <div className="font-medium">{l.requester?.firstName} {l.requester?.lastName}</div>
                                                    <div className="text-xs text-muted-foreground uppercase">{l.requester?.role}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{l.subject}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{l.description}</div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={l.status === 'APPROVED' ? 'default' : l.status === 'REJECTED' ? 'destructive' : 'outline'}>
                                                        {l.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(l.status === 'PENDING' || l.status.startsWith('PENDING_')) && (
                                                        canApproveLeaves && (l.status === 'PENDING' || l.status === 'PENDING_HOD' || l.status === 'PENDING_PRINCIPAL') && (
                                                            <Button size="sm" variant="outline" onClick={() => { setSelectedLeave(l); setLeaveProcessDialog(true); }}>
                                                                Process
                                                            </Button>
                                                        )
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="payroll" className="space-y-4">
                    {/* Month/Year selector */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {MONTHS[payMonth - 1]} {payYear}
                                    </CardTitle>
                                    <CardDescription>Payroll for all active employees</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => {
                                        if (payMonth === 1) { setPayMonth(12); setPayYear(y => y - 1); }
                                        else setPayMonth(m => m - 1);
                                    }}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => {
                                        if (payMonth === 12) { setPayMonth(1); setPayYear(y => y + 1); }
                                        else setPayMonth(m => m + 1);
                                    }}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={handleGeneratePayroll} disabled={isGenerating}>
                                        {isGenerating
                                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            : <RefreshCw className="mr-2 h-4 w-4" />}
                                        Generate Payroll
                                    </Button>
                                    <Button variant="outline" onClick={downloadPayrollCSV} disabled={payrolls.length === 0}>
                                        <Download className="mr-2 h-4 w-4" /> Export CSV
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        {payrollSummary && (
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                                        <p className="text-xl font-bold">{payrollSummary.total}</p>
                                        <p className="text-xs text-muted-foreground">Total Records</p>
                                    </div>
                                    <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
                                        <p className="text-xl font-bold text-green-700">{payrollSummary.paid}</p>
                                        <p className="text-xs text-green-600">Paid</p>
                                    </div>
                                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
                                        <p className="text-xl font-bold text-amber-700">{payrollSummary.pending}</p>
                                        <p className="text-xs text-amber-600">Pending</p>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
                                        <p className="text-xl font-bold text-blue-700">
                                            ₹{(payrollSummary.totalAmount || 0).toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-xs text-blue-600">Total Amount</p>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            {isPayrollLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : payrolls.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg">
                                    <IndianRupee className="h-10 w-10 mb-3 opacity-30" />
                                    <p>No payroll records for this month.</p>
                                    <p className="text-sm mt-1">Click "Generate Payroll" to create records for active employees.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Basic</TableHead>
                                                <TableHead>Allowances</TableHead>
                                                <TableHead>Net Salary</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payrolls.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{p.employee?.firstName} {p.employee?.lastName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {p.employee?.teacher?.employeeId || p.employee?.staff?.employeeId || `USR-${p.employee?.id?.slice(-5).toUpperCase()}`}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs uppercase">{p.employee?.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>₹{p.basicSalary.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell>₹{p.allowances.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="font-semibold">₹{p.netSalary.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell>
                                                        <Badge className={p.status === 'PAID'
                                                            ? 'bg-green-100 text-green-700 border-green-200'
                                                            : 'bg-amber-100 text-amber-700 border-amber-200'}>
                                                            {p.status === 'PAID'
                                                                ? <><CheckCircle className="inline mr-1 h-3 w-3" />Paid</>
                                                                : <><Clock className="inline mr-1 h-3 w-3" />Pending</>}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {p.status === 'PENDING' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                                onClick={() => handleMarkPaid(p.id)}
                                                            >
                                                                <CheckCircle className="mr-1 h-3 w-3" /> Mark Paid
                                                            </Button>
                                                        )}
                                                        {p.status === 'PAID' && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : 'Paid'}
                                                            </span>
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
            </Tabs>

            {/* ═══ Employee Create / Edit Dialog ═══ */}
            <Dialog open={empDialog} onOpenChange={setEmpDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingEmp ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                        <DialogDescription>
                            {editingEmp ? 'Update employee details.' : 'Create a new employee account.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitEmployee} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>First Name *</Label>
                                <Input value={empForm.firstName} onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name *</Label>
                                <Input value={empForm.lastName} onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} required disabled={!!editingEmp} />
                        </div>
                        {!editingEmp && (
                            <div className="space-y-2">
                                <Label>Password *</Label>
                                <Input type="password" value={empForm.password} onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })} required />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Joining Date</Label>
                                <Input type="date" value={empForm.joiningDate} onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Role *</Label>
                            <select className={selectCls} value={empForm.role} onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })} disabled={!!editingEmp}>
                                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Teacher-specific */}
                        {empForm.role === 'TEACHER' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Qualification</Label>
                                    <Input placeholder="e.g., B.Ed, M.Sc" value={empForm.qualification} onChange={(e) => setEmpForm({ ...empForm, qualification: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Experience (years)</Label>
                                        <Input type="number" min="0" value={empForm.experience} onChange={(e) => setEmpForm({ ...empForm, experience: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Specialization</Label>
                                        <Input placeholder="e.g., Mathematics" value={empForm.specialization} onChange={(e) => setEmpForm({ ...empForm, specialization: e.target.value })} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Staff-specific (non-teacher) */}
                        {empForm.role !== 'TEACHER' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Designation</Label>
                                    <Input placeholder="e.g., Accountant" value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Input placeholder="e.g., Finance" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 border-t pt-2">
                            <Label>Assigned QR Scanner</Label>
                            <CardDescription className="text-[10px] mb-1">
                                Restrict this employee to mark attendance only at this scanner.
                            </CardDescription>
                            <select
                                className={selectCls}
                                value={empForm.assignedScannerId}
                                onChange={(e) => setEmpForm({ ...empForm, assignedScannerId: e.target.value })}
                            >
                                <option value="">No Scanner Assigned (All Allowed)</option>
                                {scanners.filter(s => s.isActive).map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.location})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEmpDialog(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingEmp ? 'Update Employee' : 'Create Employee'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ═══ Salary Structure Dialog ═══ */}
            <Dialog open={salaryDialog} onOpenChange={setSalaryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Salary Structure</DialogTitle>
                        <DialogDescription>
                            {salaryEmp && `${salaryEmp.firstName} ${salaryEmp.lastName}`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSalary} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Basic Salary (₹) *</Label>
                            <Input
                                type="number" min="0" step="0.01"
                                placeholder="e.g., 30000"
                                value={salaryForm.basicSalary}
                                onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Allowances (₹)</Label>
                                <Input
                                    type="number" min="0" step="0.01"
                                    value={salaryForm.allowances}
                                    onChange={(e) => setSalaryForm({ ...salaryForm, allowances: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Deductions (₹)</Label>
                                <Input
                                    type="number" min="0" step="0.01"
                                    value={salaryForm.deductions}
                                    onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })}
                                />
                            </div>
                        </div>
                        {salaryForm.basicSalary && (
                            <div className="rounded-lg bg-muted/50 p-3 text-sm">
                                <span className="text-muted-foreground">Gross Salary: </span>
                                <span className="font-bold">
                                    ₹{(
                                        parseFloat(salaryForm.basicSalary || '0') +
                                        parseFloat(salaryForm.allowances || '0') -
                                        parseFloat(salaryForm.deductions || '0')
                                    ).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setSalaryDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSalarySubmitting}>
                                {isSalarySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Structure
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            {/* ═══ Leave Process Dialog ═══ */}
            <Dialog open={leaveProcessDialog} onOpenChange={setLeaveProcessDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Leave Request</DialogTitle>
                        <DialogDescription>
                            Review and approve or reject the request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLeave && (
                        <div className="space-y-4 pt-4">
                            <div className="rounded-lg bg-muted/30 p-4 text-sm">
                                <p><strong>Employee:</strong> {selectedLeave.requester?.firstName} {selectedLeave.requester?.lastName}</p>
                                <p><strong>Type:</strong> {selectedLeave.subject}</p>
                                <p><strong>Dates:</strong> {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                                <p className="mt-2"><strong>Reason:</strong> {selectedLeave.description}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Remarks</Label>
                                <Input
                                    placeholder="Optional approval/rejection notes"
                                    value={processRemarks}
                                    onChange={e => setProcessRemarks(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setLeaveProcessDialog(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => processLeaveRequest('REJECTED')}>Reject</Button>
                                <Button onClick={() => processLeaveRequest('APPROVED')}>Approve</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ Performance Review Dialog ═══ */}
            <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Performance Review</DialogTitle>
                        <DialogDescription>
                            {reviewEmp && `${reviewEmp.firstName} ${reviewEmp.lastName}`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Period Start</Label>
                                <Input type="date" value={reviewForm.periodStart} onChange={e => setReviewForm({ ...reviewForm, periodStart: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Period End</Label>
                                <Input type="date" value={reviewForm.periodEnd} onChange={e => setReviewForm({ ...reviewForm, periodEnd: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label>Ratings (1-5)</Label>
                            <div className="grid grid-cols-1 gap-2 border rounded-lg p-3">
                                {Object.keys(reviewForm.ratings).map(k => (
                                    <div key={k} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{k}</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <button
                                                    key={v} type="button"
                                                    className={`w-7 h-7 rounded text-xs ${reviewForm.ratings[k as keyof typeof reviewForm.ratings] === v ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                                                    onClick={() => setReviewForm({ ...reviewForm, ratings: { ...reviewForm.ratings, [k]: v } })}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Strengths</Label>
                            <Input value={reviewForm.strengths} onChange={e => setReviewForm({ ...reviewForm, strengths: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Areas for Improvement</Label>
                            <Input value={reviewForm.improvements} onChange={e => setReviewForm({ ...reviewForm, improvements: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>General Comments</Label>
                            <Input value={reviewForm.comments} onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setReviewDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={isReviewSubmitting}>
                                {isReviewSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Review
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
