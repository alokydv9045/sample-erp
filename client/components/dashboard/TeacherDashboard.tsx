'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, BookOpen, Clock } from 'lucide-react';
import type { DashboardStats, RecentActivity, UpcomingExam } from '@/lib/api';

interface TeacherDashboardProps {
    stats: DashboardStats;
    recentActivities: RecentActivity[];
    upcomingExams: UpcomingExam[];
}

export function TeacherDashboard({ stats, recentActivities, upcomingExams }: TeacherDashboardProps) {
    return (
        <div className="space-y-6">
            {/* Teacher Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Class Teacher Info */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Class</CardTitle>
                        <div className="rounded-full bg-green-100 p-2">
                            <Users className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.isClassTeacher ? (
                            <>
                                <div className="text-2xl font-bold">{stats.myClassName}</div>
                                <p className="text-xs text-muted-foreground">{stats.myClassStudents} Students</p>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-bold text-muted-foreground">No Class Assigned</div>
                                <p className="text-xs text-muted-foreground">Class Teacher</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Classes Today */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
                        <div className="rounded-full bg-blue-100 p-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.classesToday}</div>
                        <p className="text-xs text-muted-foreground">Scheduled sessions</p>
                    </CardContent>
                </Card>

                {/* Subjects */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                        <div className="rounded-full bg-purple-100 p-2">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.subjectCount}</div>
                        <p className="text-xs text-muted-foreground">Assigned subjects</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activities */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivities.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No recent activities</p>
                        ) : (
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4">
                                        <Badge variant="secondary">{activity.type}</Badge>
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
                            <p className="text-sm text-muted-foreground">No exams scheduled</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingExams.map((exam) => (
                                    <div key={exam.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{exam.name}</p>
                                            <p className="text-xs text-muted-foreground">{exam.class}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{new Date(exam.date).toLocaleDateString()}</p>
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
