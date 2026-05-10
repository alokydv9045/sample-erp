'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { studentAPI, documentAPI, timetableAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, User, BookOpen, Loader2, FileText, Download, File, Bus, MapPin, Clock, Navigation, Activity } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import TimetableGrid from '@/components/academic/TimetableGrid';
import UserQRCode from '@/components/qr/UserQRCode';
import { useAuth } from '@/contexts/auth-context';

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const { canManageStudents } = usePermissions();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (id) {
      fetchStudent(id as string);
    }
  }, [id]);

  const fetchStudent = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await studentAPI.getById(id);
      setStudent(data.student);
      fetchDocuments(id);
      if (data.student.sectionId) {
        fetchTimetable(data.student.sectionId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch student details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (studentId: string) => {
    try {
      setIsLoadingDocs(true);
      const res = await documentAPI.getAll(studentId);
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchTimetable = async (sectionId: string) => {
    try {
      setIsLoadingTimetable(true);
      const res = await timetableAPI.getStudentSchedule(sectionId);
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

  if (error || !student) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        </Button>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error || 'Student not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        </Button>
        {canManageStudents && (
          <Button asChild>
            <Link href={`/dashboard/users/${student.userId}/edit`}>
              Edit Student
            </Link>
          </Button>
        )}
      </div>

      {/* Student Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border">
                <AvatarImage src={student.user.avatar || undefined} alt={`${student.user.firstName} ${student.user.lastName}`} className="object-cover" />
                <AvatarFallback className="text-xl bg-muted">{student.user.firstName?.[0]}{student.user.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {student.user.firstName} {student.user.lastName}
                </CardTitle>
                <CardDescription>Admission No: {student.admissionNumber}</CardDescription>
              </div>
            </div>
            <Badge className={student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
              {student.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{student.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{student.user.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="text-sm font-medium">
                  {student.user.dateOfBirth ? new Date(student.user.dateOfBirth).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Class</p>
                <p className="text-sm font-medium">
                  {student.currentClass?.name || 'N/A'}
                  {student.section && ` - ${student.section.name}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Personal Details</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="timetable">Time Table</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
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
                  <p className="text-sm">{student.user.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                  <p className="text-sm">{student.user.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Roll Number</p>
                  <p className="text-sm">{student.rollNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                  <p className="text-sm">{student.admissionNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Academic records will be displayed here.</p>
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
                  userId={student.userId}
                  userName={`${student.user.firstName} ${student.user.lastName}`}
                  userRole="STUDENT"
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

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Fee payment records will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Class Time Table
              </CardTitle>
              <CardDescription>Weekly period distribution and timings</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTimetable ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <TimetableGrid schedule={timetable} viewType="student" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transport" className="space-y-4">
          <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-primary" />
                Transport & Safety
              </CardTitle>
              <CardDescription>Route allocation and boarding point details</CardDescription>
            </CardHeader>
            <CardContent>
              {student.transportAllocation ? (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="p-6 rounded-2xl border bg-emerald-50/20 border-emerald-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-emerald-100 rounded-lg"><Navigation className="h-4 w-4 text-emerald-600" /></div>
                          <p className="font-black text-emerald-900 uppercase text-[10px] tracking-widest">Assigned Route</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-950 leading-tight">{student.transportAllocation.route.name}</p>
                        <p className="text-xs font-bold text-emerald-700 mt-2">{student.transportAllocation.route.startLocation} ➔ {student.transportAllocation.route.endLocation}</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border bg-blue-50/20 border-blue-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg"><MapPin className="h-4 w-4 text-blue-600" /></div>
                          <p className="font-black text-blue-900 uppercase text-[10px] tracking-widest">Boarding Stop</p>
                        </div>
                        <p className="text-2xl font-black text-blue-950 leading-tight">{student.transportAllocation.stop.name}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-3 py-1 text-[10px] rounded-full">
                            <Clock className="h-3 w-3 mr-1" />
                            PICKUP: {student.transportAllocation.stop.arrivalTime}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border bg-orange-50/20 border-orange-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-orange-100 rounded-lg"><User className="h-4 w-4 text-orange-600" /></div>
                          <p className="font-black text-orange-900 uppercase text-[10px] tracking-widest">Driver / Vehicle</p>
                        </div>
                        <p className="text-xl font-black text-orange-950 leading-tight">
                          {student.transportAllocation.route.vehicle?.driver?.user?.firstName || 'Assigned Driver'}
                          {student.transportAllocation.route.vehicle?.registrationNumber && ` (${student.transportAllocation.route.vehicle.registrationNumber})`}
                        </p>
                        {student.transportAllocation.route.vehicle?.driver?.user?.phone && (
                          <p className="text-xs font-bold text-orange-700 mt-2 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {student.transportAllocation.route.vehicle.driver.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Real-time Status</p>
                        <p className="text-xs text-slate-400">View live location and estimated arrival time</p>
                      </div>
                    </div>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-white font-black rounded-full px-6">
                      <Link href="/dashboard/transport/track">
                        Track Live Bus <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/20">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Bus className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">No Transport Allocated</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                    This student is not currently enrolled in the school transport service.
                  </p>
                  <Button variant="outline" asChild className="mt-6 rounded-full font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all">
                    <Link href="/dashboard/transport/allocations">Manage Allocation</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Uploaded Documents
              </CardTitle>
              <CardDescription>Official documents and certificates for this student.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDocs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground italic">
                  No documents found for this student.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 group hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white text-primary rounded-md shadow-sm border">
                          <File className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold truncate">{doc.documentType}</p>
                          <p className="text-xs text-muted-foreground truncate">{doc.documentName}</p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                        title="Download/View"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
