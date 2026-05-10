'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { teacherAPI, timetableAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, Loader2, BookOpen, Clock } from 'lucide-react';
import TimetableGrid from '@/components/academic/TimetableGrid';
import UserQRCode from '@/components/qr/UserQRCode';
import { useAuth } from '@/contexts/auth-context';

export default function TeacherDetailPage() {
  const params = useParams();
  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (params.id) {
      fetchTeacher(params.id as string);
    }
  }, [params.id]);

  const fetchTeacher = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await teacherAPI.getById(id);
      setTeacher(data.teacher);
      fetchTimetable(id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch teacher details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimetable = async (teacherId: string) => {
    try {
      setIsLoadingTimetable(true);
      const res = await timetableAPI.getTeacherSchedule(teacherId);
      setTimetable(res.schedule || []);
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    } finally {
      setIsLoadingTimetable(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/teachers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Link>
        </Button>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error || 'Teacher not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/teachers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/users/${teacher.userId}/edit`}>
            Edit Teacher
          </Link>
        </Button>
      </div>

      {/* Teacher Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {teacher.user?.firstName} {teacher.user?.lastName}
              </CardTitle>
              <CardDescription>Employee ID: {teacher.employeeId || 'N/A'}</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{teacher.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{teacher.user?.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="text-sm font-medium">
                  {teacher.user?.dateOfBirth ? new Date(teacher.user.dateOfBirth).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Subjects</p>
                <p className="text-sm font-medium">{teacher.subjects?.length || 0} assigned</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Personal Details</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="text-sm">{teacher.user?.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                  <p className="text-sm">{teacher.user?.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                  <p className="text-sm">{teacher.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Qualification</p>
                  <p className="text-sm">{teacher.qualification || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Subject assignments will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Schedules of Periods
              </CardTitle>
              <CardDescription>Your weekly teaching schedule and class assignments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTimetable ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <TimetableGrid schedule={timetable} viewType="teacher" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <UserQRCode
                  userId={teacher.userId}
                  userName={`${teacher.user.firstName} ${teacher.user.lastName}`}
                  userRole="TEACHER"
                  isAdmin={currentUser?.roles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r)) ?? ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role ?? '')}
                />
                <div className="flex-1">
                  <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="font-semibold leading-none tracking-tight">QR Code Info</div>
                      <div className="text-sm text-muted-foreground">This QR code is used for scanning attendance at QR scanner devices</div>
                    </div>
                    <div className="p-6 pt-0 space-y-2 text-sm text-muted-foreground">
                      <p>• Each user has a unique, permanent QR code tied to their account.</p>
                      <p>• The QR is valid at any active scanner the user's role is allowed on.</p>
                      <p>• Admins can regenerate the QR if it is lost or compromised.</p>
                      <p>• GPS geofencing is enforced by the scanner device, not the QR code itself.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
