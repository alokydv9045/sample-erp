'use client';

import { useState, useEffect, useCallback } from 'react';
import { studentAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Filter,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from 'date-fns';

export default function StudentAttendancePage() {
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { toast } = useToast();

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const meRes = await studentAPI.getMe();
      if (meRes.student) {
        setStudent(meRes.student);
        const attRes = await studentAPI.getAttendance(meRes.student.id, {
          startDate: dateRange.start,
          endDate: dateRange.end,
        });
        setAttendance(attRes.attendance || []);
        setStats(attRes.stats || attRes.summary || null);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch attendance records', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, toast]);

  const downloadReport = async () => {
    if (!student?.id) return;
    setIsDownloading(true);
    try {
      const blob = await studentAPI.getAttendanceReport(student.id, {
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report_${student.admissionNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Success', description: 'Attendance report downloaded successfully' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate attendance report', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const getStatusBadge = (status: string, isAWeekend: boolean) => {
    if (!status && isAWeekend) {
      return <Badge variant="outline" className="text-muted-foreground opacity-50">Weekend</Badge>;
    }
    
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Present</Badge>;
      case 'ABSENT':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Absent</Badge>;
      case 'LATE':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Late</Badge>;
      case 'HALF_DAY':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Half Day</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Not Marked</Badge>;
    }
  };

  // Generate all days in interval
  const allDaysInRange = eachDayOfInterval({
    start: new Date(dateRange.start),
    end: new Date(dateRange.end),
  }).reverse(); // Latest first

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Attendance Record</h1>
          <p className="text-muted-foreground">History of your academic presence.</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-1 rounded-lg border shadow-sm">
          <div className="px-3 py-1.5 border-r">
            <Label className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Start Date</Label>
            <input 
              type="date" 
              className="bg-transparent text-sm font-medium outline-none" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div className="px-3 py-1.5 border-r">
            <Label className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">End Date</Label>
            <input 
              type="date" 
              className="bg-transparent text-sm font-medium outline-none" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-1 p-1">
            <Button size="icon" variant="ghost" onClick={fetchAttendance} title="Filter Records">
              <Filter className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="text-primary hover:text-primary hover:bg-primary/10" 
              onClick={downloadReport} 
              disabled={isDownloading}
              title="Download PDF Report"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50/30 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-green-700 uppercase flex items-center justify-between">
              Total Present
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-green-800">{stats?.present || 0}</p>
              <span className="text-xs text-green-600 font-medium">days</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50/30 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-red-700 uppercase flex items-center justify-between">
              Total Absent
              <XCircle className="h-4 w-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-red-800">{stats?.absent || 0}</p>
              <span className="text-xs text-red-600 font-medium">days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/30 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase flex items-center justify-between">
              Late Arrivals
              <Clock className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-amber-800">{stats?.late || 0}</p>
              <span className="text-xs text-amber-600 font-medium">times</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/30 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-blue-700 uppercase flex items-center justify-between">
              Attendance %
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-blue-800">{stats?.percentage || '—'}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Logs</CardTitle>
          <CardDescription>Comprehensive history showing all dates in the range.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked By</TableHead>
                    <TableHead>Check-in Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDaysInRange.map((day) => {
                    const record = attendance.find(r => isSameDay(new Date(r.date), day));
                    const isAWeekend = isWeekend(day);
                    
                    return (
                      <TableRow key={day.toISOString()} className={isAWeekend ? 'bg-muted/10 opacity-80' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{format(day, 'EEE, MMM dd, yyyy')}</span>
                            {isAWeekend && <span className="text-[10px] text-muted-foreground uppercase font-bold">Holiday/Weekend</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record?.status, isAWeekend)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {record?.markedByName || (record?.markedBy?.user?.firstName ? `${record.markedBy.user.firstName} ${record.markedBy.user.lastName}` : '—')}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {record?.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
