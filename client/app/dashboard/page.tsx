'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users, GraduationCap, CalendarCheck, IndianRupee,
  TrendingUp, TrendingDown, BookOpen, AlertCircle,
  FileText, UserPlus, CheckCircle2, Clock, BarChart3,
  CreditCard, Search, Printer, Receipt, ArrowRight,
  Bus, Phone, BellRing, XCircle, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { dashboardAPI, type DashboardStats, type RecentActivity, type UpcomingExam, type FeeCollectionSummary, teacherAPI, examAPI, feeAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { useSocket } from '@/hooks/useSocket';
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { StatsSkeleton, ChartSkeleton, TableSkeleton } from '@/components/dashboard/SkeletonLoaders';

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

const MODE_COLORS: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700',
  UPI: 'bg-purple-100 text-purple-700',
  CHEQUE: 'bg-blue-100 text-blue-700',
  BANK_TRANSFER: 'bg-orange-100 text-orange-700',
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { canCollectFees, canManageFees, canViewStudents } = usePermissions();

  const role = user?.role || '';
  const { socket } = useSocket();
  const firstName = user?.firstName || 'User';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Shared state ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats & {
    activeStudents?: number; totalClasses?: number; recentAdmissions?: number;
    upcomingExamCount?: number; pendingFeeCount?: number; overdueBooks?: number;
    attendancePercentage?: number; pendingFees?: number; booksDue?: number;
    pendingAttendance?: number;
    nextExam?: { name: string; date: string } | null;
  }>({
    totalStudents: 0, totalTeachers: 0, attendanceToday: 0, feesCollected: 0,
    studentsChange: 0, teachersChange: 0, attendanceChange: 0, feesChange: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [feeCollectionSummary, setFeeCollectionSummary] = useState<FeeCollectionSummary>({ totalExpected: 0, collected: 0, pending: 0, collectionRate: 0 });
  const [accountantData, setAccountantData] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifStats, setNotifStats] = useState<{ sentToday: number; scheduledCount: number; pendingCount: number; failedCount: number } | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [statsRes, activitiesRes, examsRes, feeSummaryRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(8),
        dashboardAPI.getUpcomingExams(5),
        dashboardAPI.getFeeCollectionSummary(),
      ]);
      if (statsRes.status === 'fulfilled' && statsRes.value.success) setStats(statsRes.value.stats);
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.success) setRecentActivities(activitiesRes.value.activities);
      if (examsRes.status === 'fulfilled' && examsRes.value.success) setUpcomingExams(examsRes.value.exams);
      if (feeSummaryRes.status === 'fulfilled' && feeSummaryRes.value.success) setFeeCollectionSummary(feeSummaryRes.value.summary);

      if (role === 'ACCOUNTANT') {
        const acctRes = await dashboardAPI.getAccountantStats().catch(() => null);
        if (acctRes?.success) setAccountantData(acctRes);
      }

      if (role === 'STUDENT') {
        const { studentAPI } = await import('@/lib/api');
        const studentRes = await studentAPI.getMe().catch(() => null);
        if (studentRes?.student) setStudentProfile(studentRes.student);
      }
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setIsLoading(false);
    }

    // Load notification stats (non-blocking, only for admin roles)
    if (['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      dashboardAPI.getNotificationStats().then(d => {
        if (d.stats) setNotifStats(d.stats);
      }).catch((err) => {
        console.error('Failed to load notification stats', err);
      });
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isAdminOrPrincipal = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isTeacher = role === 'TEACHER';
  const isAccountant = role === 'ACCOUNTANT';
  const isStudent = role === 'STUDENT';
  const isAdmissionManager = role === 'ADMISSION_MANAGER';

  useEffect(() => {
    loadDashboard();
  }, [role, socket]);

  useEffect(() => {
    if (socket && role) {
      socket.emit('join_dashboard', role);
      if (isTeacher && stats.myClassId) socket.emit('join_room', `class_${stats.myClassId}`);
      if (isStudent && stats.studentId) socket.emit('join_room', `student_${stats.studentId}`);

      const handleUpdate = () => loadDashboard();
      socket.on('ATTENDANCE_MARKED', handleUpdate);
      socket.on('STUDENT_REGISTERED', handleUpdate);
      socket.on('FINANCE_UPDATE', handleUpdate);
      socket.on('INVENTORY_STOCK_MOVEMENT', handleUpdate);
      socket.on('PAYROLL_GENERATED', handleUpdate);
      socket.on('PAYROLL_PAID', handleUpdate);
      socket.on('LIBRARY_BOOK_ISSUED', handleUpdate);
      socket.on('LIBRARY_BOOK_RETURNED', handleUpdate);
      socket.on('ANNOUNCEMENT_CREATED', handleUpdate);

      return () => {
        socket.off('ATTENDANCE_MARKED', handleUpdate);
        socket.off('STUDENT_REGISTERED', handleUpdate);
        socket.off('FINANCE_UPDATE', handleUpdate);
        socket.off('INVENTORY_STOCK_MOVEMENT', handleUpdate);
        socket.off('PAYROLL_GENERATED', handleUpdate);
        socket.off('PAYROLL_PAID', handleUpdate);
        socket.off('LIBRARY_BOOK_ISSUED', handleUpdate);
        socket.off('LIBRARY_BOOK_RETURNED', handleUpdate);
        socket.off('ANNOUNCEMENT_CREATED', handleUpdate);
      };
    }
  }, [role, socket, stats.myClassId, stats.studentId, isTeacher, isStudent]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-2">
            <div className="h-9 w-64 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-40 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <StatsSkeleton />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <TableSkeleton rows={6} />
          </div>
          <div className="col-span-3">
             <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
           <ChartSkeleton />
           <ChartSkeleton />
           <ChartSkeleton />
        </div>
      </div>
    );
  }

  const acctSummary = accountantData?.summary ?? { todayCollection: 0, yearCollection: 0, pendingAmount: 0, txToday: 0 };
  const acctTx = accountantData?.todayTransactions ?? [];
  const acctDefaulters = accountantData?.defaulters ?? [];

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdminOrPrincipal ? 'School Overview' : isAccountant ? 'Fee Collection' : isTeacher ? 'Teacher Dashboard' : isAdmissionManager ? 'Admission Control' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdminOrPrincipal
              ? `Welcome back, ${firstName}. Here's your complete school summary.`
              : isAccountant
                ? `Welcome, ${firstName}. Here's your financial overview for today.`
                : isTeacher
                  ? `Good day, ${firstName}. Here's what's happening in your classes.`
                  : isAdmissionManager
                    ? `Welcome, ${firstName}. Track your admission funnel and registration targets.`
                    : `Hello, ${firstName}. Here's your personal summary.`}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => loadDashboard()} className="flex-1 sm:flex-none gap-2 h-9">
            <Clock className="h-4 w-4" />
            <span className="inline">Refresh</span>
          </Button>
          <Badge variant="outline" className="flex-1 sm:flex-none justify-center text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 bg-primary/5 text-primary border-primary/20 h-9">
            {today}
          </Badge>
        </div>
      </div>

      {/* ── Student Profile Quick Glance (Only for Students) ── */}
      {isStudent && studentProfile && (
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader className="pb-3 border-b bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{studentProfile.user?.firstName} {studentProfile.user?.lastName}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] uppercase font-bold tracking-wider">Adm: {studentProfile.admissionNumber}</Badge>
                    <span>·</span>
                    <span className="font-medium text-primary/80">{studentProfile.currentClass?.name} {studentProfile.section?.name ? `- Section ${studentProfile.section.name}` : ''}</span>
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600 border-none">{studentProfile.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Personal</p>
                <div className="space-y-1 mt-2">
                  <p className="text-sm">DOB: {studentProfile.user?.dateOfBirth ? new Date(studentProfile.user.dateOfBirth).toLocaleDateString('en-IN') : '—'}</p>
                  <p className="text-sm">Gender: {studentProfile.user?.gender || '—'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Family</p>
                <div className="space-y-1 mt-2">
                  <p className="text-sm">Father: {studentProfile.parents?.[0]?.parent?.firstName || '—'}</p>
                  <p className="text-sm">Ph: {studentProfile.parents?.[0]?.parent?.phone || '—'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact</p>
                <div className="space-y-1 mt-2">
                  <p className="text-sm truncate">Email: {studentProfile.user?.email || '—'}</p>
                  <p className="text-sm">Phone: {studentProfile.user?.phone || '—'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                <p className="text-xs text-muted-foreground mt-2 leading-tight">{studentProfile.user?.address || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION 1: Top KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdminOrPrincipal && (<>
          <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-sm font-semibold text-muted-foreground/80">Active Students <Users className="h-4 w-4 text-blue-500" /></CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{(stats.activeStudents ?? stats.totalStudents ?? 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.totalStudents ?? 0} total enrolled</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-sm font-semibold text-muted-foreground/80">Teachers <GraduationCap className="h-4 w-4 text-green-500" /></CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{stats.totalTeachers ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Across {stats.totalClasses ?? '—'} classes</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 overflow-hidden group hover:shadow-md transition-all duration-300 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-sm font-bold uppercase tracking-tight text-muted-foreground/80">Attendance Status</span>
              <CalendarCheck className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100">{stats.attendanceToday ?? 0}%</div>
                <div className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                  (stats.attendanceChange ?? 0) >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  {(stats.attendanceChange ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(stats.attendanceChange ?? 0)}%
                </div>
              </div>
              <Progress value={stats.attendanceToday ?? 0} className="mt-4 h-2" />
              
              <div className="mt-5 pt-4 border-t border-dashed flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Class Submissions Today</p>
                  <p className="text-xl font-black text-purple-700 dark:text-purple-400">
                    {stats.attendanceDetails?.marked ?? 0} <span className="text-xs font-semibold text-muted-foreground">/ {stats.attendanceDetails?.total ?? 0} Fully Marked</span>
                  </p>
                </div>
                {stats.attendanceDetails?.marked === stats.attendanceDetails?.total && (stats.attendanceDetails?.total ?? 0) > 0 ? (
                  <Badge variant="outline" className="h-6 px-2 border-green-500/30 bg-green-50 text-[10px] font-bold text-green-600 uppercase">Complete</Badge>
                ) : (
                  <Badge variant="outline" className="h-6 px-2 border-amber-500/30 bg-amber-50 text-[10px] font-bold text-amber-600 uppercase">Ongoing</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-sm font-semibold text-muted-foreground/80">Fees Month <IndianRupee className="h-4 w-4 text-orange-500" /></CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">₹{((stats.feesCollected ?? 0) / 1000).toFixed(1)}K</div>
              <p className={cn("text-xs flex items-center mt-1 font-medium", (stats.feesChange ?? 0) >= 0 ? "text-green-600" : "text-red-600")}>
                {(stats.feesChange ?? 0) >= 0 ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
                {Math.abs(stats.feesChange ?? 0)}% <span className="text-muted-foreground/70 ml-1">vs last month</span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-cyan-500 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-sm font-semibold text-muted-foreground/80">New Admissions <UserPlus className="h-4 w-4 text-cyan-500" /></CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{stats.recentAdmissions ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-rose-500 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-sm font-semibold text-muted-foreground/80">Upcoming Exams <FileText className="h-4 w-4 text-rose-500" /></CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{stats.upcomingExamCount ?? upcomingExams.length}</div>
              <p className="text-xs text-muted-foreground mt-1">In next 30 days</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-sm font-semibold text-muted-foreground/80">Pending Fees <IndianRupee className="h-4 w-4 text-red-500" /></CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{stats.pendingFeeCount ?? stats.pendingFees ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding payments</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-sm font-semibold text-muted-foreground/80">Overdue Books <BookOpen className="h-4 w-4 text-amber-500" /></CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{stats.overdueBooks ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Library overdue</p>
            </CardContent>
          </Card>
        </>)}

        {isAccountant && (<>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-1 text-xs font-bold uppercase text-muted-foreground">Today's Collection</CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{formatINR(acctSummary.todayCollection)}</div>
              <p className="text-[10px] text-primary/80">{acctSummary.txToday} receipts today</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/60">
            <CardHeader className="pb-1 text-xs font-bold uppercase text-muted-foreground">Year-to-Date</CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{formatINR(acctSummary.yearCollection)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-1 text-xs font-bold uppercase text-muted-foreground">Pending Amount</CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-destructive">{formatINR(acctSummary.pendingAmount)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40">
            <CardHeader className="pb-1 text-xs font-bold uppercase text-muted-foreground">TX Count</CardHeader>
            <CardContent><div className="text-2xl font-black">{acctSummary.txToday}</div></CardContent>
          </Card>
        </>)}

        {isTeacher && (<>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-1 text-xs font-bold uppercase">Attendance Today</CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stats.attendanceToday}%</div>
              <Progress value={stats.attendanceToday} className="mt-2 h-1" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/60">
            <CardHeader className="pb-1 text-xs font-bold uppercase">My Students</CardHeader>
            <CardContent><div className="text-2xl font-black">{stats.totalStudents}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40">
            <CardHeader className="pb-1 text-xs font-bold uppercase">Pending Attend.</CardHeader>
            <CardContent><div className="text-2xl font-black">{stats.pendingAttendance ?? 0}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-1 text-xs font-bold uppercase">Overdue Books</CardHeader>
            <CardContent><div className="text-2xl font-black">{stats.overdueBooks ?? 0}</div></CardContent>
          </Card>
        </>)}

        {isStudent && (<>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-1 text-xs font-bold uppercase">Attendance</CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stats.attendancePercentage ?? stats.attendanceToday}%</div>
              <Progress value={stats.attendancePercentage ?? stats.attendanceToday} className="mt-2 h-1" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-1 text-xs font-bold uppercase text-destructive">Pending Fee</CardHeader>
            <CardContent><div className="text-2xl font-black">{stats.pendingFees ?? 0}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40">
            <CardHeader className="pb-1 text-xs font-bold uppercase">Books Due</CardHeader>
            <CardContent><div className="text-2xl font-black">{stats.booksDue ?? 0}</div></CardContent>
          </Card>
          <Link href="/dashboard/exams/results">
            <Card className="border-l-4 border-l-primary/60 group hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="pb-1 text-xs font-bold uppercase flex-row justify-between items-center">Results <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" /></CardHeader>
              <CardContent><div className="text-xl font-black group-hover:text-primary transition-colors">View Report</div></CardContent>
            </Card>
          </Link>
        </>)}
      </div>

      {/* ── Dynamic Layout (Recent Activity & Fee Summary) ── */}
      {isAdminOrPrincipal && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="rounded-xl border bg-card text-card-foreground col-span-4 border-none shadow-sm overflow-hidden">
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between pb-3 bg-muted/30">
                <div>
                  <div className="leading-none tracking-tight flex items-center gap-2 text-foreground font-bold">
                    <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />Recent Activity
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Latest events across the school</div>
                </div>
              </div>
              <div className="p-6 pt-4">
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                  {recentActivities.map((activity, idx) => {
                    const isFinancial = activity.type?.includes('FEE') || activity.type?.includes('PAYROLL');
                    const isAcademic = activity.type?.includes('EXAM') || activity.type?.includes('STUDENT');

                    return (
                      <div key={idx} className="flex items-start gap-4 p-2 hover:bg-primary/5 rounded-lg transition-all border border-transparent hover:border-primary/10">
                        <div className={cn(
                          "mt-1 w-2 h-2 rounded-full shrink-0",
                          isFinancial ? "bg-orange-500" : isAcademic ? "bg-blue-500" : "bg-primary"
                        )}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight">{activity.description}</p>
                          <p className="text-[10px] font-black uppercase text-primary/60 mt-1 flex items-center gap-1">
                            {activity.type?.replace(/_/g, ' ') || 'SYSTEM'} · <Clock className="h-3 w-3" /> {activity.time || 'Just now'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground col-span-3 border-none shadow-sm overflow-hidden flex flex-col">
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between pb-3 bg-muted/30">
                <div>
                  <div className="leading-none tracking-tight flex items-center gap-2 text-foreground font-bold italic">
                    <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />Fee Collection
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Current academic year summary</div>
                </div>
              </div>
              <div className="p-6 pt-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected</span>
                    <span className="font-semibold">{formatINR(feeCollectionSummary.totalExpected)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Collected</span>
                    <span className="font-semibold text-green-600">{formatINR(feeCollectionSummary.collected)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-destructive">{formatINR(feeCollectionSummary.pending)}</span>
                  </div>
                  <div className="pt-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-black uppercase tracking-tighter text-primary">Collection Rate</span>
                      <span className="font-black">{Number(feeCollectionSummary.collectionRate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={Number(feeCollectionSummary.collectionRate || 0)} className="h-2" />
                  </div>
                </div>
                <Link href="/dashboard/fees" className="mt-8">
                  <Button className="w-full gap-2 font-bold shadow-sm" variant="outline">
                    View Full Report <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              NOTIFICATION STATS WIDGET (Admin / Super Admin)
              ══════════════════════════════════════════════════════════════════════ */}
          {notifStats && (
            <Card className="border-l-4 border-l-violet-500">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <BellRing className="h-4 w-4 text-violet-600" /> Notification Overview
                  </CardTitle>
                  <CardDescription>WhatsApp notification delivery stats</CardDescription>
                </div>
                <Link href="/dashboard/notifications">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-violet-600 hover:text-violet-700">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-green-600">{notifStats.sentToday}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sent Today</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-blue-600">{notifStats.scheduledCount}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-orange-600">{notifStats.pendingCount}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Send className="h-3 w-3" /> Pending</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-red-600">{notifStats.failedCount}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          NOTIFICATION STATS WIDGET (Admin / Super Admin)
          ══════════════════════════════════════════════════════════════════════ */}
      {isAdminOrPrincipal && notifStats && (
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BellRing className="h-4 w-4 text-violet-600" /> Notification Overview
              </CardTitle>
              <CardDescription>WhatsApp notification delivery stats</CardDescription>
            </div>
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-violet-600 hover:text-violet-700">
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-green-600">{notifStats.sentToday}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sent Today</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-blue-600">{notifStats.scheduledCount}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-orange-600">{notifStats.pendingCount}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Send className="h-3 w-3" /> Pending</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-red-600">{notifStats.failedCount}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: Accountant Quick Actions
          ══════════════════════════════════════════════════════════════════════ */}
      {isAccountant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/fees/collect">
                <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <CreditCard className="h-4 w-4" /> Collect Fee
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Transport Horizontal Overview (Admin Only) ── */}
      {isAdminOrPrincipal && (
        <div className="py-4">
          <Link href="/dashboard/transport">
            <Card className="group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-r from-indigo-500/10 via-background to-background ring-1 ring-indigo-500/20 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="bg-indigo-500 p-6 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Bus className="h-8 w-8 text-white" />
                  </div>
                  <div className="p-6 flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Fleet Status</p>
                      <p className="text-2xl font-black mt-1">{stats.transport?.totalVehicles ?? 0} <span className="text-sm font-medium text-muted-foreground">Vehicles</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Trips</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-2xl font-black">{stats.transport?.activeTrips ?? 0}</p>
                        {stats.transport?.onRoad && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 h-5 animate-pulse">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Live
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Allocations</p>
                      <p className="text-2xl font-black mt-1">{stats.transport?.totalAllocations ?? 0}</p>
                    </div>
                    <div className="lg:text-right">
                      <Button variant="ghost" size="sm" className="group-hover:bg-indigo-500 group-hover:text-white transition-all text-indigo-600">
                        Manage Logistics <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* ── Integrated Academic Calendar & Upcoming Events Widget (Universal) ── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2"><CalendarWidget /></div>
        <div className="lg:col-span-1"><UpcomingEvents /></div>
      </div>

      {isAdminOrPrincipal && (
        <div className="space-y-12">
          {/* ── Real-time Analytics ── */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <RealtimeChart title="Attendance Trend" endpoint="/dashboard/attendance-trend" socketEvent="ATTENDANCE_MARKED" type="area" xAxisKey="date" dataKey="percentage" color="var(--primary)" description="Student presence over 7 days" />
            <RealtimeChart title="Admission Activity" endpoint="/dashboard/admission-stats" socketEvent="STUDENT_REGISTERED" type="bar" xAxisKey="name" dataKey="count" color="#10b981" description="Registration funnel by class" />
            <RealtimeChart title="Financial Overview" endpoint="/dashboard/finance-stats" socketEvent="FINANCE_UPDATE" type="pie" xAxisKey="name" dataKey="value" dataProperty="modes" colors={["#6366f1", "#f59e0b", "#10b981", "#ef4444"]} description="Current payment mode distribution" />
          </div>

          {/* ── Operational Trends (Admin Only) ── */}
          <div className="space-y-6 pt-4 pb-8">
            <div className="flex items-center gap-3 px-1 mb-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase font-black tracking-tighter text-[10px] px-2 py-0.5">Historical Tracking</Badge>
              <h2 className="text-xl font-extrabold tracking-tight">Operational Trends</h2>
              <div className="h-px bg-muted flex-1" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <RealtimeChart
                title="Library Engagement"
                endpoint="/dashboard/library-stats"
                socketEvent="LIBRARY_BOOK_ISSUED"
                type="line"
                xAxisKey="month"
                dataKey="count"
                color="#8b5cf6"
                description="Monthly book issue volume"
              />
              <RealtimeChart
                title="Staff Presence"
                endpoint="/dashboard/hr-stats"
                socketEvent="ATTENDANCE_MARKED"
                type="line"
                xAxisKey="date"
                dataKey="present"
                color="#f59e0b"
                description="Daily staff attendance totals"
              />
              <RealtimeChart
                title="Financial Performance"
                endpoint="/dashboard/finance-stats"
                socketEvent="FINANCE_UPDATE"
                type="line"
                xAxisKey="month"
                dataKey={["collected", "pending", "target"]}
                colors={["#10b981", "#ef4444", "#3b82f6"]}
                description="Collected vs Pending vs Target (6m)"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Admission Manager Functional Section ── */}
      {isAdmissionManager && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="text-xs font-bold uppercase pb-1">Total Strength</CardHeader><CardContent><div className="text-2xl font-black">{stats.totalStudents}</div></CardContent></Card>
            <Card><CardHeader className="text-xs font-bold uppercase pb-1">Month Adm.</CardHeader><CardContent><div className="text-2xl font-black">{stats.admissionsThisMonth ?? 0}</div></CardContent></Card>
          </div>
          <Card className="shadow-sm border-none bg-primary/5">
            <CardHeader className="pb-3 text-center"><CardTitle className="text-sm font-bold uppercase">Admission Workflow</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard/students/register"><Button size="sm">Register Student</Button></Link>
              <Link href="/dashboard/admissions/enquiries"><Button size="sm" variant="outline">Manage Enquiries</Button></Link>
            </CardContent>
          </Card>
          {/* Enquiry Table */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center bg-muted/20">
              <CardTitle className="text-sm font-bold">Recent Enquiries</CardTitle>
              <Link href="/dashboard/admissions/enquiries"><Button variant="link" size="sm">View All</Button></Link>
            </CardHeader>
            <CardContent className="pt-4 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {stats.recentEnquiries?.map(enq => (
                      <TableRow key={enq.id}>
                        <TableCell className="font-bold text-sm">{enq.studentName}</TableCell>
                        <TableCell>{enq.class}</TableCell>
                        <TableCell>{enq.phone}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{enq.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Accountant Quick Actions & Feed ── */}
      {isAccountant && (
        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader className="bg-muted/20"><CardTitle className="text-sm font-bold">Today's Transactions</CardTitle></CardHeader>
            <CardContent className="pt-4 divide-y divide-primary/5">
              {acctTx.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5">
                  <div><p className="text-sm font-bold">{tx.studentName}</p><p className="text-[10px] text-muted-foreground">{tx.receipt}</p></div>
                  <div className="text-right"><p className="text-sm font-black text-primary">₹{tx.amount}</p><p className="text-[10px] text-muted-foreground">{tx.mode}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader className="bg-destructive/5"><CardTitle className="text-sm font-bold text-destructive">Top Defaulters</CardTitle></CardHeader>
            <CardContent className="pt-4">
              {acctDefaulters.map((d: any) => (
                <div key={d.studentId} className="flex items-center justify-between py-2 border-b border-muted/50 last:border-0 text-sm">
                  <span>{d.name}</span> <span className="font-bold text-destructive">₹{d.pendingAmount}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Teacher Analytics & Links ── */}
      {isTeacher && stats.myClassId && (
        <div className="grid gap-6 md:grid-cols-2">
          <RealtimeChart title="Class Attendance" endpoint={`/dashboard/attendance-trend?classId=${stats.myClassId}`} socketEvent="ATTENDANCE_MARKED" type="area" xAxisKey="date" dataKey="percentage" color="var(--primary)" />
          <RealtimeChart title="Class Performance" endpoint={`/dashboard/class-performance?classId=${stats.myClassId}`} socketEvent="EXAM_RESULT_PUBLISHED" type="bar" xAxisKey="name" dataKey="score" color="#00C49F" />
        </div>
      )}

      {/* ── Upcoming Exams Row (Role Agnostic Except Accountant) ── */}
      {!isAccountant && upcomingExams.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-muted/10"><CardTitle className="text-sm font-bold flex items-center gap-2"><FileText className="h-4 w-4" />Upcoming Examinations</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingExams.map(exam => (
                <div key={exam.id} className="p-3 rounded-lg border border-primary/10 flex justify-between items-center">
                  <div><p className="text-sm font-bold truncate max-w-[150px]">{exam.name}</p><p className="text-[10px] text-muted-foreground">{exam.subject}</p></div>
                  <Badge variant="outline" className="text-[10px]">{new Date(exam.date).toLocaleDateString('en-IN')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
