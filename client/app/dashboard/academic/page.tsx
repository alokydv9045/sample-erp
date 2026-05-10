'use client';

import { useState, useEffect, useCallback } from 'react';
import { SERVER_BASE_URL } from '@/lib/api/apiConfig';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { academicAPI, teacherAPI, studentAPI, timetableAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, Loader2, Edit, Trash2, BookOpen, GraduationCap, 
  Clock, CheckCircle2, Upload, FileText, Wand2, Settings, 
  ArrowRight, ChevronDown, ChevronUp 
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

import TimetableGrid from '@/components/academic/TimetableGrid';
import TimetableWizard from '@/components/academic/TimetableWizard';
import SlotEditDialog from '@/components/academic/SlotEditDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

export default function AcademicPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');
  const { canManageAcademics, isStudent } = usePermissions();
  const { user } = useAuth();


  // ── Student Data State ──────────────────────────────────────────────────
  const [studentData, setStudentData] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // ── Create / Edit dialogs ──────────────────────────────────────────────
  const [classDialog, setClassDialog] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);

  // null = create mode, object = edit mode
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);

  // ── Delete confirmation dialogs ────────────────────────────────────────
  const [deleteClassDialog, setDeleteClassDialog] = useState(false);
  const [deleteSubjectDialog, setDeleteSubjectDialog] = useState(false);
  const [deleteSectionDialog, setDeleteSectionDialog] = useState(false);
  const [deletingClass, setDeletingClass] = useState<any>(null);
  const [deletingSubject, setDeletingSubject] = useState<any>(null);
  const [deletingSection, setDeletingSection] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Forms ──────────────────────────────────────────────────────────────
  const emptyClass = { name: '', numericValue: '', description: '', academicYearId: '', classTeacherId: '' };
  const emptySubject = { name: '', code: '', description: '', classId: '', teacherId: '' };
  const emptySection = { name: '', capacity: '', classId: '' };

  const [classForm, setClassForm] = useState(emptyClass);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [sectionForm, setSectionForm] = useState(emptySection);


  const [timetables, setTimetables] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [timetableForm, setTimetableForm] = useState({ name: '', classId: '', type: 'DAILY' });
  const [deletingTimetable, setDeletingTimetable] = useState<any>(null);
  const [deleteTimetableDialog, setDeleteTimetableDialog] = useState(false);

  // ── Logical Timetable State ──────────────────────────────────────────
  const [selectedClassForLogic, setSelectedClassForLogic] = useState<string>('');
  const [selectedSectionForLogic, setSelectedSectionForLogic] = useState<string>('');
  const [dynamicSchedule, setDynamicSchedule] = useState<any[]>([]);
  const [isRefreshingSchedule, setIsRefreshingSchedule] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [isPdfArchivesOpen, setIsPdfArchivesOpen] = useState(false);
  const [generateConfirmDialog, setGenerateConfirmDialog] = useState(false);

  const fetchTimetables = useCallback(async () => {
    try {
      const { academicAPI } = await import('@/lib/api');
      const res = await academicAPI.getTimetables();
      if (res && res.timetables) setTimetables(res.timetables);
    } catch (err) {
      console.error('Failed to fetch timetables', err);
    }
  }, []);

  const fetchStudentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentAPI.getMe();
      if (res && res.student) {
        setStudentData(res.student);

        // Fetch subjects for student's class - FIXED: passing object as expected by API client
        if (res.student.currentClassId) {
          const subjectsRes = await academicAPI.getSubjects({ classId: res.student.currentClassId });
          if (subjectsRes && subjectsRes.subjects) setSubjects(subjectsRes.subjects);
        }

        // Fetch attendance stats for this student - FIXED: mapping from backend stats object
        const attRes = await studentAPI.getAttendance(res.student.id);
        if (attRes) {
          setAttendanceStats(attRes.stats || attRes.summary || attRes);
          setAttendanceRecords(attRes.attendance || []);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTimetableUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableFile || !timetableForm.classId || !timetableForm.name) {
      toast.error('Please fill all fields and select a PDF');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', timetableFile);
      formData.append('name', timetableForm.name);
      formData.append('classId', timetableForm.classId);
      formData.append('type', timetableForm.type);
      formData.append('effectiveFrom', new Date().toISOString());

      const { academicAPI } = await import('@/lib/api');
      await academicAPI.createTimetable(formData);
      toast.success('Timetable uploaded successfully');
      setUploadDialog(false);
      fetchTimetables();
    } catch (err) {
      toast.error('Failed to upload timetable');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchDynamicSchedule = useCallback(async (sectionId: string) => {
    if (!sectionId) return;
    setIsRefreshingSchedule(true);
    try {
      const res = await timetableAPI.getStudentSchedule(sectionId);
      setDynamicSchedule(res.schedule || []);
    } catch (error) {
      console.error('Failed to fetch dynamic schedule:', error);
    } finally {
      setIsRefreshingSchedule(false);
    }
  }, []);

  const handleGenerateBaseline = async () => {
    if (!selectedClassForLogic || !selectedSectionForLogic) return;
    const timetableId = dynamicSchedule[0]?.timetableId || null;

    setIsLoading(true);
    try {
      const configRes = await timetableAPI.getConfig(selectedClassForLogic);
      const configId = configRes.config?.id;
      if (!configId) {
        toast({ title: "Config Missing", description: "School timings are not configured for this class yet.", variant: "destructive" });
        return;
      }
      await timetableAPI.generateBaseline(timetableId, configId, selectedClassForLogic);
      toast({ title: "Timetable Reset", description: "Baseline skeleton generated successfully." });
      fetchDynamicSchedule(selectedSectionForLogic);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message ||
        (typeof error?.response?.data?.error === 'string' ? error?.response?.data?.error : null) ||
        error?.message ||
        "Failed to generate baseline.";
      toast({ title: "Generation Failed", description: errMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotLogicClick = (slot: any) => {
    if (slot.isSpecialSlot) {
      toast({ title: "Special Slot", description: "Breaks and lunch slots are managed via the Routine Wizard." });
      return;
    }
    setActiveSlot(slot);
    setIsEditorOpen(true);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesData, subjectsData, sectionsData, yearsData, teachersData] = await Promise.all([
        academicAPI.getClasses(),
        academicAPI.getSubjects(),
        academicAPI.getSections(),
        academicAPI.getAcademicYears(),
        teacherAPI.getAll(),
      ]);
      setClasses(classesData.classes || []);
      setSubjects(subjectsData.subjects || []);
      setSections(sectionsData.sections || []);
      setAcademicYears(yearsData.academicYears || []);
      setTeachers(teachersData.teachers || []);

      const currentYear = yearsData.academicYears?.find((y: any) => y.isCurrent);
      if (currentYear) {
        setClassForm(prev => ({ ...prev, academicYearId: prev.academicYearId || currentYear.id }));
      }
    } catch {
      toast.error('Failed to load academic data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStudent && user) {
      fetchStudentData();
      fetchTimetables();
    } else {
      fetchData();
      fetchTimetables();
    }
  }, [isStudent, user, fetchStudentData, fetchData, fetchTimetables]);

  // ── Open edit dialogs (pre-fill) ───────────────────────────────────────
  const openEditClass = (cls: any) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      numericValue: String(cls.numericValue),
      description: cls.description || '',
      academicYearId: cls.academicYear?.id || cls.academicYearId || '',
      classTeacherId: cls.classTeacherId || '',
    });
    setClassDialog(true);
  };

  const openEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      classId: subject.class?.id || subject.classId || '',
      teacherId: subject.teachers?.[0]?.teacherId || '',
    });
    setSubjectDialog(true);
  };

  const openEditSection = (section: any) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      capacity: String(section.maxStudents || 40),
      classId: section.class?.id || section.classId || '',
    });
    setSectionDialog(true);
  };

  // ── Open create dialogs (reset form) ──────────────────────────────────
  const openCreateClass = () => {
    setEditingClass(null);
    const currentYear = academicYears.find((y: any) => y.isCurrent);
    setClassForm({ ...emptyClass, academicYearId: currentYear?.id || '' });
    setClassDialog(true);
  };

  const openCreateSubject = () => {
    setEditingSubject(null);
    setSubjectForm(emptySubject);
    setSubjectDialog(true);
  };

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionForm(emptySection);
    setSectionDialog(true);
  };

  // ── Submit handlers ────────────────────────────────────────────────────
  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: classForm.name,
        numericValue: classForm.numericValue,
        description: classForm.description,
        academicYearId: classForm.academicYearId,
        classTeacherId: classForm.classTeacherId || null,
      };
      if (editingClass) {
        await academicAPI.updateClass(editingClass.id, payload);
        toast.success('Class updated successfully');
      } else {
        await academicAPI.createClass(payload);
        toast.success('Class created successfully');
      }
      setClassDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: subjectForm.name,
        code: subjectForm.code,
        description: subjectForm.description,
        classId: subjectForm.classId,
        teacherId: subjectForm.teacherId || null,
      };
      if (editingSubject) {
        await academicAPI.updateSubject(editingSubject.id, payload);
        toast.success('Subject updated successfully');
      } else {
        await academicAPI.createSubject(payload);
        toast.success('Subject created successfully');
      }
      setSubjectDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: sectionForm.name,
        classId: sectionForm.classId,
        maxStudents: sectionForm.capacity,
      };
      if (editingSection) {
        await academicAPI.updateSection(editingSection.id, payload);
        toast.success('Section updated successfully');
      } else {
        await academicAPI.createSection(payload);
        toast.success('Section created successfully');
      }
      setSectionDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete handlers ────────────────────────────────────────────────────
  const handleDeleteClass = async () => {
    if (!deletingClass) return;
    setIsSubmitting(true);
    try {
      await academicAPI.deleteClass(deletingClass.id);
      toast.success('Class deleted successfully');
      setDeleteClassDialog(false);
      setDeletingClass(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    setIsSubmitting(true);
    try {
      await academicAPI.deleteSubject(deletingSubject.id);
      toast.success('Subject deleted successfully');
      setDeleteSubjectDialog(false);
      setDeletingSubject(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    setIsSubmitting(true);
    try {
      await academicAPI.deleteSection(deletingSection.id);
      toast.success('Section deleted successfully');
      setDeleteSectionDialog(false);
      setDeletingSection(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete section');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared delete confirmation dialog ──────────────────────────────────
  const DeleteConfirmDialog = ({
    open, onOpenChange, title, description, onConfirm,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isStudent) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Overview</h1>
            <p className="text-muted-foreground">Manage your academic journey</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudentData}
            disabled={isLoading}
            className="flex gap-2"
          >
            <Clock className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Current Subjects
              </CardTitle>
              <CardDescription>Subjects assigned to your class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic">No subjects listed</TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((sub: any) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell className="text-xs">{sub.code}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{sub.type}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Timetables
              </CardTitle>
              <CardDescription>Recent class schedules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {timetables.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground italic border rounded-lg border-dashed">
                  No timetables uploaded yet
                </div>
              ) : (
                timetables.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{t.type}</p>
                    </div>
                    {t.pdfUrl && (
                      <a href={`${SERVER_BASE_URL}${t.pdfUrl}`} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost"><FileText className="h-4 w-4" /></Button>
                      </a>
                    )}
                  </div>
                ))
              )}
              {timetables.length > 0 && <Button variant="outline" className="w-full text-xs">View All</Button>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Academic Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-muted/20 text-center space-y-2 flex flex-col items-center justify-between">
                <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground" />
                <h3 className="font-semibold text-sm">Target Class</h3>
                <p className="text-xs font-medium text-primary">
                  {studentData && studentData.currentClass ? `${studentData.currentClass.name} ${studentData.section ? `(${studentData.section.name})` : ''}` : 'Loading...'}
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/20 text-center space-y-2 flex flex-col items-center justify-between">
                <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground" />
                <h3 className="font-semibold text-sm">Attendance Progress</h3>
                {attendanceStats ? (
                  <p className="text-xs font-bold text-primary">
                    {attendanceStats.percentage ? `${attendanceStats.percentage}% Overall` :
                      (attendanceStats.present !== undefined ? `${attendanceStats.present} Days Present` : 'Status Available')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History Card */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Recent attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRecords && attendanceRecords.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">S.No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.slice(0, 10).map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.markedByName || 'System'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              record.status === 'PRESENT'
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                                : record.status === 'ABSENT'
                                  ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'
                                  : record.status === 'LATE'
                                    ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100'
                                    : 'bg-slate-100 text-slate-800'
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-slate-50 rounded-lg border">
                <Clock className="h-8 w-8 mb-2 opacity-50" />
                <p>No attendance records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );

  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Management</h1>
        <p className="text-muted-foreground">Manage classes, subjects, and sections</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          {canManageAcademics && <TabsTrigger value="timetables">Timetables</TabsTrigger>}
          <TabsTrigger value="exams">Exams & Results</TabsTrigger>
        </TabsList>

        {/* ── Classes Tab ── */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Classes</CardTitle>
                  <CardDescription>Manage class/grade levels</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {canManageAcademics && (
                    <Button onClick={openCreateClass}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Class
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Class Teacher</TableHead>
                        <TableHead>Students</TableHead>
                        {canManageAcademics && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No classes found. Create one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        classes.map((cls) => (
                          <TableRow key={cls.id}>
                            <TableCell className="font-medium">{cls.name}</TableCell>
                            <TableCell>{cls.numericValue}</TableCell>
                            <TableCell>{cls.academicYear?.name || '—'}</TableCell>
                            <TableCell>{cls.classTeacher ? `${cls.classTeacher.user?.firstName} ${cls.classTeacher.user?.lastName}` : '—'}</TableCell>
                            <TableCell>{cls._count?.students || 0}</TableCell>
                            {canManageAcademics && (
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditClass(cls)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => { setDeletingClass(cls); setDeleteClassDialog(true); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Subjects Tab ── */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Subjects</CardTitle>
                  <CardDescription>Manage academic subjects</CardDescription>
                </div>
                {canManageAcademics && (
                  <Button onClick={openCreateSubject}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subject
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Description</TableHead>
                        {canManageAcademics && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No subjects found. Create one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>{subject.code}</TableCell>
                            <TableCell>{subject.class?.name || '—'}</TableCell>
                            <TableCell>
                              {subject.teachers && subject.teachers.length > 0 ? (
                                <Badge variant="secondary" className="font-normal">
                                  {subject.teachers[0].teacher?.user?.firstName} {subject.teachers[0].teacher?.user?.lastName}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">—</span>
                              )}
                            </TableCell>
                            <TableCell>{subject.description || '-'}</TableCell>
                            {canManageAcademics && (
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditSubject(subject)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => { setDeletingSubject(subject); setDeleteSubjectDialog(true); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sections Tab ── */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>Manage class sections/divisions</CardDescription>
                </div>
                {canManageAcademics && (
                  <Button onClick={openCreateSection}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Max Students</TableHead>
                        <TableHead>Students</TableHead>
                        {canManageAcademics && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No sections found. Create one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sections.map((section) => (
                          <TableRow key={section.id}>
                            <TableCell className="font-medium">Section {section.name}</TableCell>
                            <TableCell>{section.class?.name || '—'}</TableCell>
                            <TableCell>{section.maxStudents || 40}</TableCell>
                            <TableCell>{section._count?.students || 0}</TableCell>
                            {canManageAcademics && (
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditSection(section)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => { setDeletingSection(section); setDeleteSectionDialog(true); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Timetables Tab (Unified Management) ── */}
        {canManageAcademics && (
          <TabsContent value="timetables" className="space-y-6">
            {/* 1. Dynamic Schedule Manager */}
            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-primary/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-primary" />
                      Dynamic Schedule Manager
                    </CardTitle>
                    <CardDescription>Configure routines and assign subjects to periods</CardDescription>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsWizardOpen(true)} 
                      disabled={!selectedClassForLogic}
                      className="flex-1 md:flex-none"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Routine Wizard
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setGenerateConfirmDialog(true)} 
                      disabled={!selectedSectionForLogic || isLoading}
                      className="flex-1 md:flex-none"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      Baseline
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Class / Grade</Label>
                    <Select value={selectedClassForLogic} onValueChange={(val) => {
                      setSelectedClassForLogic(val);
                      setSelectedSectionForLogic('');
                      setDynamicSchedule([]);
                    }}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Section / Division</Label>
                    <Select 
                      value={selectedSectionForLogic} 
                      onValueChange={(val) => {
                        setSelectedSectionForLogic(val);
                        fetchDynamicSchedule(val);
                      }}
                      disabled={!selectedClassForLogic}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.find(c => c.id === selectedClassForLogic)?.sections?.map((sec: any) => (
                          <SelectItem key={sec.id} value={sec.id}>Section {sec.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!selectedSectionForLogic ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 border-2 border-dashed rounded-xl bg-slate-50/50">
                    <ArrowRight className="h-12 w-12 mb-4 animate-pulse" />
                    <h3 className="text-lg font-bold">Select Class & Section</h3>
                    <p className="text-sm max-w-xs mx-auto mt-1">Pick a class and section to start managing the weekly schedule.</p>
                  </div>
                ) : isRefreshingSchedule ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-medium">Syncing Schedule...</p>
                  </div>
                ) : dynamicSchedule.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                    <Wand2 className="h-12 w-12 text-primary/40 mb-4" />
                    <h3 className="text-lg font-bold">No Schedule Found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                      This section doesn't have a schedule yet. Launch the wizard to create one.
                    </p>
                    <Button onClick={() => setIsWizardOpen(true)}>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Setup Routine
                    </Button>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    <TimetableGrid 
                      schedule={dynamicSchedule} 
                      viewType="admin" 
                      onSlotClick={handleSlotLogicClick}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. PDF Archives (Legacy System) */}
            <div className="pt-4">
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-between p-4 bg-white border shadow-sm rounded-xl hover:bg-slate-50"
                onClick={() => setIsPdfArchivesOpen(!isPdfArchivesOpen)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">Uploaded Timetables (PDF Archives)</span>
                  <Badge variant="secondary" className="ml-2">{timetables.length}</Badge>
                </div>
                {isPdfArchivesOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>

              {isPdfArchivesOpen && (
                <Card className="mt-4 border-none shadow-md overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  <CardHeader className="bg-slate-50/50 pb-4 border-b">
                     <div className="flex justify-between items-center">
                        <CardDescription>Manage static PDF schedules for download or print.</CardDescription>
                        <Button size="sm" onClick={() => setUploadDialog(true)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload PDF
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {timetables.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm italic">No PDF archives found.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50/30">
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>PDF File</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {timetables.map((t: any) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium">{t.name}</TableCell>
                              <TableCell>{t.class?.name || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] uppercase">{t.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {t.pdfUrl && (
                                  <a href={`${SERVER_BASE_URL}${t.pdfUrl}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600">
                                      <FileText className="h-3.5 w-3.5 mr-1" /> View
                                    </Button>
                                  </a>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => { setDeletingTimetable(t); setDeleteTimetableDialog(true); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
        {/* ── Exams Tab ── */}
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Examination & Results</CardTitle>
              <CardDescription>Configure terms, grading scales, and manage student results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-dashed bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Exam Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-4">Create and schedule exams, assign subjects and marks structure.</p>
                    <Button asChild className="w-full" size="sm">
                      <Link href="/dashboard/exams">Go to Exams</Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-dashed bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Terms & Grading</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-4">Define academic terms and customize grading scales for the institution.</p>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1" size="sm">
                        <Link href="/dashboard/exams/terms">Terms</Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1" size="sm">
                        <Link href="/dashboard/exams/grading">Grading</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-dashed bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-4">Principal review and approval of generated student report cards.</p>
                    <Button asChild variant="secondary" className="w-full" size="sm">
                      <Link href="/dashboard/exams">Pending Review</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════
          CLASS DIALOG (Create / Edit)
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={classDialog} onOpenChange={setClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            <DialogDescription>
              {editingClass ? 'Update the class details below.' : 'Create a new class/grade level'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitClass} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classAcademicYear">Academic Year *</Label>
              <select
                id="classAcademicYear"
                className={selectClass}
                value={classForm.academicYearId}
                onChange={(e) => setClassForm({ ...classForm, academicYearId: e.target.value })}
                required
              >
                <option value="" disabled>Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name *</Label>
                <Input
                  id="className"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="e.g., Grade 10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numericValue">Numeric Level *</Label>
                <Input
                  id="numericValue"
                  type="number"
                  min="1"
                  max="12"
                  value={classForm.numericValue}
                  onChange={(e) => setClassForm({ ...classForm, numericValue: e.target.value })}
                  placeholder="e.g., 10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classDescription">Description</Label>
              <Input
                id="classDescription"
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classTeacher">Class Teacher</Label>
              <select
                id="classTeacher"
                className={selectClass}
                value={classForm.classTeacherId}
                onChange={(e) => setClassForm({ ...classForm, classTeacherId: e.target.value })}
              >
                <option value="">No Class Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user?.firstName} {teacher.user?.lastName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Optional — assign a class teacher</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setClassDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingClass ? 'Update Class' : 'Create Class'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          SUBJECT DIALOG (Create / Edit)
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <DialogDescription>
              {editingSubject ? 'Update the subject details below.' : 'Create a new subject and link it to a class'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitSubject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectClass">Class *</Label>
              <select
                id="subjectClass"
                className={selectClass}
                value={subjectForm.classId}
                onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })}
                required
              >
                <option value="" disabled>Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.academicYear?.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject Name *</Label>
                <Input
                  id="subjectName"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectCode">Subject Code *</Label>
                <Input
                  id="subjectCode"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  placeholder="e.g., MATH101"
                  required
                />
              </div>
            </div>
            {!editingSubject && (
              <div className="space-y-2">
                <Label htmlFor="subjectTeacher">Subject Teacher (Optional)</Label>
                <select
                  id="subjectTeacher"
                  className={selectClass}
                  value={subjectForm.teacherId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                >
                  <option value="">Select Teacher</option>
                  {teachers && teachers.length > 0 && teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="subjectDescription">Description</Label>
              <Input
                id="subjectDescription"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setSubjectDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingSubject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION DIALOG (Create / Edit)
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
            <DialogDescription>
              {editingSection ? 'Update the section details below.' : 'Create a new section for a class'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitSection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sectionClassId">Class *</Label>
              <select
                id="sectionClassId"
                className={selectClass}
                value={sectionForm.classId}
                onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
                required
              >
                <option value="" disabled>Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sectionName">Section Name *</Label>
                <Input
                  id="sectionName"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  placeholder="e.g., A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={sectionForm.capacity}
                  onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                  placeholder="e.g., 40"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setSectionDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingSection ? 'Update Section' : 'Create Section'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          TIMETABLE UPLOAD DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Timetable</DialogTitle>
            <DialogDescription>Upload a PDF schedule for a specific class.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTimetableUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <select
                className={selectClass}
                value={timetableForm.classId}
                onChange={(e) => setTimetableForm({ ...timetableForm, classId: e.target.value })}
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Timetable Title</Label>
              <Input
                placeholder="e.g., Weekly Schedule - Term 1"
                value={timetableForm.name}
                onChange={(e) => setTimetableForm({ ...timetableForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className={selectClass}
                value={timetableForm.type}
                onChange={(e) => setTimetableForm({ ...timetableForm, type: e.target.value })}
              >
                <option value="DAILY">Daily</option>
                <option value="EXAM">Exam</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>PDF File (Max 5MB)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setTimetableFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Upload PDF
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOGS
      ═══════════════════════════════════════════════════════════════════ */}
      <DeleteConfirmDialog
        open={deleteClassDialog}
        onOpenChange={setDeleteClassDialog}
        title="Delete Class"
        description={`Are you sure you want to delete "${deletingClass?.name}"? This will also delete all its subjects and sections. This action cannot be undone.`}
        onConfirm={handleDeleteClass}
      />

      <DeleteConfirmDialog
        open={deleteSubjectDialog}
        onOpenChange={setDeleteSubjectDialog}
        title="Delete Subject"
        description={`Are you sure you want to delete "${deletingSubject?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteSubject}
      />

      <DeleteConfirmDialog
        open={deleteSectionDialog}
        onOpenChange={setDeleteSectionDialog}
        title="Delete Section"
        description={`Are you sure you want to delete "Section ${deletingSection?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteSection}
      />

      <DeleteConfirmDialog
        open={deleteTimetableDialog}
        onOpenChange={setDeleteTimetableDialog}
        title="Delete Timetable"
        description={`Are you sure you want to delete "${deletingTimetable?.name}"? The PDF file will also be permanently removed. This action cannot be undone.`}
        onConfirm={async () => {
          if (!deletingTimetable) return;
          setIsSubmitting(true);
          try {
            const { academicAPI } = await import('@/lib/api');
            await academicAPI.deleteTimetable(deletingTimetable.id);
            toast.success('Timetable deleted successfully');
            setDeleteTimetableDialog(false);
            setDeletingTimetable(null);
            fetchTimetables();
          } catch {
            toast.error('Failed to delete timetable');
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
      <TimetableWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)}
        classId={selectedClassForLogic}
        academicYearId={classes.find(c => c.id === selectedClassForLogic)?.academicYearId || ''}
        onSuccess={() => {
          setIsWizardOpen(false);
          handleGenerateBaseline();
        }}
      />

      <SlotEditDialog 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        slot={activeSlot}
        classId={selectedClassForLogic}
        onSuccess={() => fetchDynamicSchedule(selectedSectionForLogic)}
      />

      <DeleteConfirmDialog
        open={generateConfirmDialog}
        onOpenChange={setGenerateConfirmDialog}
        title="Reset to Baseline?"
        description="This will PERMANENTLY DELETE all current subject assignments for this section and recreate the empty skeleton based on school timings. This action cannot be undone."
        onConfirm={() => {
          setGenerateConfirmDialog(false);
          handleGenerateBaseline();
        }}
      />
    </div>
  );
}
