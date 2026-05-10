'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { examAPI, academicAPI, termAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2, Eye, Calendar, Trash2, Lock, Unlock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { isAdmin, canCreateExams } = usePermissions();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [selectedYear, selectedClass, selectedTerm, selectedStatus]);

  const fetchInitialData = async () => {
    try {
      const [yearsRes, classesRes, termsRes] = await Promise.all([
        academicAPI.getAcademicYears(),
        academicAPI.getClasses(),
        termAPI.getAll(),
      ]);
      setAcademicYears(yearsRes.academicYears || []);
      setClasses(classesRes.classes || []);
      setTerms(termsRes.terms || []);
    } catch (err) {
      console.error('Failed to fetch filter data', err);
      toast.error('Failed to load filters');
    }
  };

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedYear !== 'all') params.academicYearId = selectedYear;
      if (selectedClass !== 'all') params.classId = selectedClass;
      if (selectedTerm !== 'all') params.termId = selectedTerm;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const data = await examAPI.getAll(params);
      setExams(data.exams || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch exams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam? This will delete all associated subjects and marks.')) return;

    try {
      await examAPI.delete(id);
      setExams(exams.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete exam');
    }
  };

  const handleToggleFreeze = async (exam: any) => {
    try {
      if (exam.isFrozen) {
        await examAPI.unfreeze(exam.id);
      } else {
        await examAPI.freeze(exam.id);
      }
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  const filteredExams = exams.filter((exam) => {
    const searchLower = searchQuery.toLowerCase();
    return exam.name?.toLowerCase().includes(searchLower);
  });

  const getStatusBadge = (exam: any) => {
    if (exam.isFrozen) {
      return { label: 'Frozen', className: 'bg-red-100 text-red-700' };
    }

    switch (exam.status) {
      case 'DRAFT': return { label: 'Draft', className: 'bg-gray-100 text-gray-700' };
      case 'PUBLISHED': return { label: 'Published', className: 'bg-green-100 text-green-700' };
      case 'IN_PROGRESS': return { label: 'In Progress', className: 'bg-blue-100 text-blue-700' };
      case 'COMPLETED': return { label: 'Completed', className: 'bg-purple-100 text-purple-700' };
      default:
        const now = new Date();
        const start = new Date(exam.startDate);
        if (start > now) return { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' };
        return { label: 'Active', className: 'bg-green-100 text-green-700' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Examinations</h1>
          <p className="text-muted-foreground">Manage exams, schedules, and results</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard/exams/terms">Manage Terms</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/exams/report-templates">Report Templates</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/exams/grading">Grading Scales</Link>
              </Button>
            </>
          )}
          {canCreateExams && (
            <Button asChild>
              <Link href="/dashboard/exams/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <RealtimeChart
          title="Subject Performance"
          description="Average marks distribution across subjects"
          endpoint="/dashboard/exam-stats"
          socketEvent="EXAM_UPDATE"
          type="radar"
          dataKey="average"
          xAxisKey="subject"
          color="#ec4899"
        />
        <RealtimeChart
          title="Average Score Trend"
          description="Class average performance over time"
          endpoint="/dashboard/exam-stats"
          socketEvent="EXAM_UPDATE"
          type="line"
          dataKey="average"
          xAxisKey="date"
          color="#3b82f6"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Examination Schedule</CardTitle>
          <CardDescription>
            View and manage all scheduled examinations ({filteredExams.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search exams by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <Label className="mb-2 block">Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40">
              <Label className="mb-2 block">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40">
              <Label className="mb-2 block">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
          ) : filteredExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No exams found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedYear !== 'all' || selectedClass !== 'all' || selectedTerm !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first exam'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => {
                    const status = getStatusBadge(exam);
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">
                          {exam.name}
                          {exam.isFrozen && <Lock className="inline ml-2 h-3 w-3 text-red-500" />}
                        </TableCell>
                        <TableCell>{exam.class?.name || 'All Classes'}</TableCell>
                        <TableCell>{exam.term?.name || '-'}</TableCell>
                        <TableCell>{new Date(exam.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={status.className} variant="secondary">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild title="View Details">
                              <Link href={`/dashboard/exams/${exam.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleFreeze(exam)}
                                  title={exam.isFrozen ? "Unfreeze Results" : "Freeze Results"}
                                >
                                  {exam.isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(exam.id)}
                                  disabled={exam.isFrozen}
                                  title="Delete Exam"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
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
