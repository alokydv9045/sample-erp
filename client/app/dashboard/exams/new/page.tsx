'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { examAPI, academicAPI, termAPI, gradeScaleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Plus, Trash2, Calendar, Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExamSubjectRow {
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  duration: string;
  totalMarks: number;
  passMarks: number;
  theoryMaxMarks: number;
  practicalMaxMarks: number;
  internalMaxMarks: number;
}

export default function NewExamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown data
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [gradeScales, setGradeScales] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    examType: 'MID_TERM',
    academicYearId: '',
    classId: '',
    termId: '',
    gradeScaleId: '',
    startDate: '',
    endDate: '',
  });

  const [examSubjects, setExamSubjects] = useState<ExamSubjectRow[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.classId) {
      fetchClassSubjects(formData.classId);
    } else {
      setAvailableSubjects([]);
      setExamSubjects([]);
    }
  }, [formData.classId]);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const [yearsRes, classesRes, termsRes, scalesRes] = await Promise.all([
        academicAPI.getAcademicYears(),
        academicAPI.getClasses(),
        termAPI.getAll(),
        gradeScaleAPI.getAll(),
      ]);
      setAcademicYears(yearsRes.academicYears || []);
      setClasses(classesRes.classes || []);
      setTerms(termsRes.terms || []);
      setGradeScales(scalesRes.scales || []);

      // Auto-select current academic year if available
      const currentYear = yearsRes.academicYears?.find((y: any) => y.isCurrent);
      if (currentYear) {
        setFormData(prev => ({ ...prev, academicYearId: currentYear.id }));
      }
    } catch (err) {
      console.error('Failed to fetch initial data', err);
      toast.error('Failed to load form data. Please refresh.');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchClassSubjects = async (classId: string) => {
    try {
      const data = await academicAPI.getSubjects({ classId });
      setAvailableSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch class subjects', err);
      toast.error('Failed to load class subjects');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const addSubjectRow = () => {
    setExamSubjects([
      ...examSubjects,
      {
        subjectId: '',
        subjectName: '',
        examDate: formData.startDate || '',
        startTime: '09:00',
        duration: '180',
        totalMarks: 100,
        passMarks: 40,
        theoryMaxMarks: 80,
        practicalMaxMarks: 20,
        internalMaxMarks: 0,
      }
    ]);
  };

  const removeSubjectRow = (index: number) => {
    setExamSubjects(examSubjects.filter((_, i) => i !== index));
  };

  const updateSubjectRow = (index: number, field: string, value: any) => {
    const updated = [...examSubjects];
    const row = { ...updated[index] };

    if (field === 'subjectId') {
      const subj = availableSubjects.find(s => s.id === value);
      row.subjectId = value;
      row.subjectName = subj?.name || '';
    } else if (['totalMarks', 'passMarks', 'theoryMaxMarks', 'practicalMaxMarks', 'internalMaxMarks'].includes(field)) {
      (row as any)[field] = parseFloat(value) || 0;

      // Auto-validate: Theory + Practical + Internal should equal Total
      if (field !== 'totalMarks') {
        row.totalMarks = (row.theoryMaxMarks || 0) + (row.practicalMaxMarks || 0) + (row.internalMaxMarks || 0);
      }
    } else {
      (row as any)[field] = value;
    }

    updated[index] = row;
    setExamSubjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.academicYearId || !formData.startDate) {
      setError('Please fill in all required fields.');
      return;
    }

    if (examSubjects.length === 0) {
      setError('Please add at least one subject to the exam.');
      return;
    }

    // Validate subjects
    const invalidSubject = examSubjects.find(s => !s.subjectId || !s.examDate || s.totalMarks <= 0);
    if (invalidSubject) {
      setError('Please complete subject details (Subject, Date, and Marks) for all rows.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await examAPI.create({
        ...formData,
        subjects: examSubjects,
      });
      router.push('/dashboard/exams');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create exam');
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/exams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exams
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Examination</CardTitle>
            <CardDescription>Configure basic exam details and grading scale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Exam Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Annual Examination 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select value={formData.examType} onValueChange={(v) => handleSelectChange('examType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNIT_TEST">Unit Test</SelectItem>
                    <SelectItem value="MID_TERM">Mid-Term</SelectItem>
                    <SelectItem value="FINAL">Final Examination</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="CLASS_TEST">Class Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Select value={formData.academicYearId} onValueChange={(v) => handleSelectChange('academicYearId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => (
                      <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={formData.classId} onValueChange={(v) => handleSelectChange('classId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Term (Optional)</Label>
                <Select value={formData.termId} onValueChange={(v) => handleSelectChange('termId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Grading Scale *</Label>
                <Select value={formData.gradeScaleId} onValueChange={(v) => handleSelectChange('gradeScaleId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeScales.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Details about the exam..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Subjects Configuration */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Subjects & Marks Allocation</CardTitle>
              <CardDescription>Add subjects and define their maximum marks structure</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSubjectRow} disabled={!formData.classId}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </CardHeader>
          <CardContent>
            {!formData.classId ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <BookOpen className="h-8 w-8 mb-2" />
                <p>Select a class first to add subjects</p>
              </div>
            ) : examSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Plus className="h-8 w-8 mb-2" />
                <p>No subjects added yet. Click "Add Subject" to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Subject</TableHead>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead className="w-[100px]">Time</TableHead>
                      <TableHead className="w-[80px]">Theory</TableHead>
                      <TableHead className="w-[80px]">Practical</TableHead>
                      <TableHead className="w-[80px]">Internal</TableHead>
                      <TableHead className="w-[70px]">Total</TableHead>
                      <TableHead className="w-[70px]">Pass</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examSubjects.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={row.subjectId} onValueChange={(v) => updateSubjectRow(idx, 'subjectId', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSubjects.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={row.examDate}
                            onChange={(e) => updateSubjectRow(idx, 'examDate', e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <Input
                              type="time"
                              value={row.startTime}
                              onChange={(e) => updateSubjectRow(idx, 'startTime', e.target.value)}
                              className="h-9 px-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.theoryMaxMarks}
                            onChange={(e) => updateSubjectRow(idx, 'theoryMaxMarks', e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.practicalMaxMarks}
                            onChange={(e) => updateSubjectRow(idx, 'practicalMaxMarks', e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.internalMaxMarks}
                            onChange={(e) => updateSubjectRow(idx, 'internalMaxMarks', e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell className="font-semibold">{row.totalMarks}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.passMarks}
                            onChange={(e) => updateSubjectRow(idx, 'passMarks', e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeSubjectRow(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Examination...
              </>
            ) : (
              'Create Examination'
            )}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href="/dashboard/exams">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
