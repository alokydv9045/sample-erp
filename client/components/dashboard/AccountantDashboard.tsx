'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DollarSign,
    TrendingUp,
    AlertCircle,
    Receipt,
    Search,
    Printer,
    CreditCard,
    Clock,
    CheckCircle2,
    ArrowRight,
    Users,
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/hooks/useSocket';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface AccountantStats {
    summary: {
        todayCollection: number;
        yearCollection: number;
        pendingAmount: number;
        txToday: number;
    };
    todayTransactions: Array<{
        id: string;
        receipt: string;
        studentName: string;
        class: string;
        amount: number;
        mode: string;
        time: string;
    }>;
    defaulters: Array<{
        studentId: string;
        name: string;
        class: string;
        pendingAmount: number;
    }>;
    trend: Array<{ month: string; collected: number }>;
    modeBreakdown: Array<{ mode: string; amount: number; count: number }>;
}

const MODE_COLORS: Record<string, string> = {
    CASH: 'bg-green-100 text-green-700',
    UPI: 'bg-purple-100 text-purple-700',
    CHEQUE: 'bg-blue-100 text-blue-700',
    BANK_TRANSFER: 'bg-orange-100 text-orange-700',
    ONLINE: 'bg-cyan-100 text-cyan-700',
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

function formatINR(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
}

function formatFull(amount: number): string {
    const locale = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';
    return `₹${amount.toLocaleString(locale)}`;
}

function formatTime(iso: string): string {
    const locale = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';
    return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function AccountantDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<AccountantStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { socket } = useSocket();

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.emit('join_dashboard', 'ACCOUNTANT');
            
            socket.on('FEE_PAYMENT_CREATED', () => {
                // Re-fetch stats to update trend and summary
                fetchStats();
            });
        }
        
        return () => {
            if (socket) {
                socket.off('FEE_PAYMENT_CREATED');
            }
        };
    }, [socket]);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const res = await dashboardAPI.getAccountantStats();
            if (res.success) setData(res);
        } catch (err) {
            console.error('Failed to load accountant stats', err);
        } finally {
            setIsLoading(false);
        }
    };

    const firstName = user?.firstName || 'Accountant';
    const today = new Date().toLocaleDateString(process.env.NEXT_PUBLIC_LOCALE || 'en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard…</p>
                </div>
            </div>
        );
    }

    const summary = data?.summary ?? { todayCollection: 0, yearCollection: 0, pendingAmount: 0, txToday: 0 };
    const txList = data?.todayTransactions ?? [];
    const defaulters = data?.defaulters ?? [];
    const trend = data?.trend ?? [];

    return (
        <div className="space-y-6">
            {/* ──── Header ──── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fee Collection</h1>
                    <p className="mt-1 text-muted-foreground">
                        Welcome, {firstName}. Here's your financial overview for today.
                    </p>
                </div>
                <Badge variant="outline" className="border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
                    {today}
                </Badge>
            </div>

            {/* ──── KPI Cards ──── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Today's Collection */}
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
                        <div className="rounded-full bg-green-100 p-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatINR(summary.todayCollection)}</div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {summary.txToday} transaction{summary.txToday !== 1 ? 's' : ''} today
                        </p>
                    </CardContent>
                </Card>

                {/* Year-to-Date Collection */}
                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Year-to-Date</CardTitle>
                        <div className="rounded-full bg-indigo-100 p-2">
                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatINR(summary.yearCollection)}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Current academic year</p>
                    </CardContent>
                </Card>

                {/* Pending Amount */}
                <Card className={`border-l-4 border-l-orange-500 ${summary.pendingAmount > 0 ? 'bg-orange-50/30' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                        <div className="rounded-full bg-orange-100 p-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{formatINR(summary.pendingAmount)}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Across all students</p>
                    </CardContent>
                </Card>

                {/* Tx Count Today */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions Today</CardTitle>
                        <div className="rounded-full bg-blue-100 p-2">
                            <Receipt className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.txToday}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Fee receipts issued</p>
                    </CardContent>
                </Card>
            </div>

            {/* ──── Quick Actions ──── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/dashboard/fees/collect">
                            <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                                <CreditCard className="h-4 w-4" />
                                Collect Fee
                            </Button>
                        </Link>
                        <Link href="/dashboard/students">
                            <Button variant="outline" className="gap-2">
                                <Search className="h-4 w-4" />
                                Search Student
                            </Button>
                        </Link>
                        <Link href="/dashboard/fees">
                            <Button variant="outline" className="gap-2">
                                <Printer className="h-4 w-4" />
                                Reprint Receipt
                            </Button>
                        </Link>
                        <Link href="/dashboard/fees">
                            <Button variant="outline" className="gap-2">
                                <Users className="h-4 w-4" />
                                Pending Fees List
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* ──── Row: Transactions + Trend ──── */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Today's Transactions Table */}
                <Card className="col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Today's Transactions
                            </CardTitle>
                            <CardDescription>All fee receipts issued today</CardDescription>
                        </div>
                        <Link href="/dashboard/fees">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                View All <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {txList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <Receipt className="h-10 w-10 mb-2 opacity-30" />
                                <p className="text-sm">No transactions yet today</p>
                                <Link href="/dashboard/fees/collect" className="mt-3">
                                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">Collect First Fee</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-0 divide-y">
                                {txList.slice(0, 8).map((tx) => (
                                    <div key={tx.id} className="flex items-center gap-3 py-2.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{tx.studentName}</p>
                                            <p className="text-xs text-muted-foreground">{tx.class} · #{tx.receipt}</p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`shrink-0 text-xs ${MODE_COLORS[tx.mode] ?? 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {tx.mode}
                                        </Badge>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold text-green-700">{formatFull(tx.amount)}</p>
                                            <p className="flex items-center gap-0.5 text-xs text-muted-foreground justify-end">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(tx.time)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 6-Month Trend Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            Collection Trend
                        </CardTitle>
                        <CardDescription>Last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trend.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                                No data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatFull(value), 'Collected']}
                                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                    />
                                    <Bar dataKey="collected" radius={[4, 4, 0, 0]}>
                                        {trend.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ──── Pending Defaulters List ──── */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Top Pending Students
                        </CardTitle>
                        <CardDescription>Students with the highest outstanding balances</CardDescription>
                    </div>
                    <Link href="/dashboard/fees">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            Full List <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {defaulters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-10 w-10 mb-2 text-green-400" />
                            <p className="text-sm font-medium text-green-600">All fees are up to date!</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {defaulters.map((d, i) => (
                                <div key={d.studentId} className="flex items-center gap-4 py-3">
                                    <span className="w-5 text-xs text-muted-foreground font-mono">{i + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{d.name}</p>
                                        <p className="text-xs text-muted-foreground">{d.class}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-orange-600">{formatFull(d.pendingAmount)}</p>
                                        <p className="text-xs text-muted-foreground">pending</p>
                                    </div>
                                    <Link href="/dashboard/fees/collect">
                                        <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2">
                                            Collect
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
