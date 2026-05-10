'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, BookOpen, AlertCircle, Clock } from 'lucide-react';
import type { DashboardStats, RecentActivity, UpcomingExam } from '@/lib/api';

interface StudentDashboardProps {
    stats: DashboardStats;
    recentActivities: RecentActivity[];
    upcomingExams: UpcomingExam[];
}

export function StudentDashboard({ stats, recentActivities, upcomingExams }: StudentDashboardProps) {
    return (
        <div className="space-y-6">
            {/* Student Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Attendance */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
                        <div className="rounded-full bg-blue-100 p-2">
                            <CalendarCheck className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.attendancePercentage}%</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>

                {/* Pending Fees */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
                        <div className="rounded-full bg-orange-100 p-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingFees}</div>
                        <p className="text-xs text-muted-foreground">Unpaid invoices</p>
                    </CardContent>
                </Card>

                {/* Library Books */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Books Due</CardTitle>
                        <div className="rounded-full bg-pink-100 p-2">
                            <Clock className="h-4 w-4 text-pink-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.booksDue}</div>
                        <p className="text-xs text-muted-foreground">Books to return</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activities */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>My Recent Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivities.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No recent activities</p>
                        ) : (
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                            {activity.type}
                                        </Badge>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Exams List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Upcoming Exams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingExams.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No upcoming exams</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingExams.map((exam) => (
                                    <div key={exam.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{exam.name}</p>
                                            <p className="text-xs text-muted-foreground">{exam.subject}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{new Date(exam.date).toLocaleDateString()}</p>
                                            <Badge variant="outline" className="mt-1 text-xs">
                                                {Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
