'use client';

import { useState, useEffect, useCallback } from 'react';
import { assignmentAPI, academicAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Loader2,
  Trash2,
  FileText,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SERVER_BASE_URL } from '@/lib/api/apiConfig';
import { format } from 'date-fns';
import SmartAssignmentModal from '@/components/dashboard/SmartAssignmentModal';
import { Sparkles, Wand2 } from 'lucide-react';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  
  // Academic Data for dropdowns
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    subjectId: '',
    classId: '',
    sectionId: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const [gradeForm, setGradeForm] = useState({
    grade: '',
    feedback: '',
  });

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await assignmentAPI.getTeacherAssignments();
      setAssignments(res.assignments || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch assignments', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchAcademicData = useCallback(async () => {
    try {
      const [classesRes, subjectsRes, sectionsRes] = await Promise.all([
        academicAPI.getClasses(),
        academicAPI.getSubjects(),
        academicAPI.getSections(),
      ]);
      setClasses(classesRes.classes || []);
      setSubjects(subjectsRes.subjects || []);
      setSections(sectionsRes.sections || []);
    } catch (err) {
      console.error('Failed to fetch academic data', err);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchAcademicData();
  }, [fetchAssignments, fetchAcademicData]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('dueDate', form.dueDate);
      formData.append('subjectId', form.subjectId);
      formData.append('classId', form.classId);
      if (form.sectionId) formData.append('sectionId', form.sectionId);
      if (file) formData.append('file', file);
      if (generatedPdfUrl && !file) formData.append('aiPdfPath', generatedPdfUrl);

      await assignmentAPI.createAssignment(formData);
      toast({ title: 'Success', description: 'Assignment created successfully' });
      setCreateDialogOpen(false);
      setForm({ title: '', description: '', dueDate: '', subjectId: '', classId: '', sectionId: '' });
      setFile(null);
      setGeneratedPdfUrl(null); // Clear AI generated PDF
      fetchAssignments();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to create assignment', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await assignmentAPI.deleteAssignment(id);
      toast({ title: 'Success', description: 'Assignment deleted successfully' });
      fetchAssignments();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete assignment', variant: 'destructive' });
    }
  };

  const openGradingDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setGradeForm({
      grade: submission.grade || '',
      feedback: submission.feedback || '',
    });
    setGradingDialogOpen(true);
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setIsSubmitting(true);
    try {
      await assignmentAPI.gradeSubmission(selectedSubmission.id, gradeForm);
      toast({ title: 'Success', description: 'Submission graded successfully' });
      setGradingDialogOpen(false);
      // Refresh details if open
      if (assignmentDetails) {
        const res = await assignmentAPI.getAssignmentDetails(assignmentDetails.id);
        setAssignmentDetails(res.assignment);
      }
      fetchAssignments();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to grade submission', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewSubmissions = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await assignmentAPI.getAssignmentDetails(id);
      setAssignmentDetails(res.assignment);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch assignment details', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Management</h1>
          <p className="text-muted-foreground">Create and grade student assignments</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Fill in the details to assign work to students.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mathematics Chapter 1 Homework"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Instructions for students..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <select
                    className={selectClass}
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Section (Optional)</Label>
                  <select
                    className={selectClass}
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                  >
                    <option value="">All Sections</option>
                    {sections.filter(s => s.classId === form.classId).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select
                    className={selectClass}
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.filter(s => s.classId === form.classId).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <Label htmlFor="file">Reference File (Optional)</Label>
                   <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] text-primary hover:text-primary/80 hover:bg-primary/5 flex items-center gap-1"
                    onClick={() => setSmartModalOpen(true)}
                  >
                    <Sparkles className="h-3 w-3" />
                    Smart Assistant (AI)
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="file"
                    type="file"
                    className="flex-1"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setGeneratedPdfUrl(null); // Clear AI pdf if manual file selected
                    }}
                    disabled={!!generatedPdfUrl}
                  />
                  {generatedPdfUrl && (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle2 className="h-3 w-3" />
                      AI Reference Added
                    </Badge>
                  )}
                </div>
                {generatedPdfUrl && (
                  <p className="text-[10px] text-muted-foreground"> EduSphere AI has generated a PDF reference material. It will be attached when you create the assignment.</p>
                )}
              </div>

              <SmartAssignmentModal 
                open={smartModalOpen}
                onOpenChange={setSmartModalOpen}
                initialData={{
                  subject: subjects.find(s => s.id === form.subjectId)?.name,
                  className: classes.find(c => c.id === form.classId)?.name
                }}
                onApply={(data) => {
                  setForm({
                    ...form,
                    title: form.title || data.topic,
                    description: data.description
                  });
                  setGeneratedPdfUrl(data.pdfUrl);
                  // In a real flow, we'd need to handle the file upload for this generated URL
                  // For now, we'll assume the backend will link it if we send the pdfUrl in formData
                  toast({ title: 'AI Content Applied', description: 'Form description and reference file have been updated.' });
                }}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Assignment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Assignments</CardTitle>
              <CardDescription>All assignments created by you.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && assignments.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-10 border rounded-lg border-dashed">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-muted-foreground">No assignments created yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Class/Subject</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id} className="group">
                          <TableCell>
                            <div className="font-semibold">{assignment.title}</div>
                            {assignment.filePath && (
                              <a 
                                href={`${SERVER_BASE_URL}${assignment.filePath}`} 
                                target="_blank" 
                                className="text-[10px] text-primary flex items-center hover:underline mt-1"
                              >
                                <ExternalLink className="h-2 w-2 mr-1" />
                                Reference File
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{assignment.class?.name}</div>
                            <div className="text-xs text-muted-foreground">{assignment.subject?.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                              {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-bold">
                              {assignment._count?.submissions || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => viewSubmissions(assignment.id)}>
                                View
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAssignment(assignment.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {assignmentDetails ? (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{assignmentDetails.title}</CardTitle>
                    <CardDescription>{assignmentDetails.class?.name} - {assignmentDetails.subject?.name}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setAssignmentDetails(null)}>
                    <Plus className="h-4 w-4 rotate-45" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="text-sm border-b pb-4">
                  <Label className="text-xs text-muted-foreground uppercase font-bold">Submissions</Label>
                  <div className="mt-2 space-y-2">
                    {assignmentDetails.submissions?.length === 0 ? (
                      <p className="text-xs text-center py-4 italic text-muted-foreground">No submissions yet.</p>
                    ) : (
                      assignmentDetails.submissions.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-2 border rounded-md bg-white hover:border-primary/50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {sub.student?.user?.firstName} {sub.student?.user?.lastName}
                            </p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className={`text-[9px] px-1 h-4 leading-none ${
                                sub.status === 'GRADED' ? 'bg-green-50 text-green-700' : 
                                sub.status === 'LATE' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {sub.status}
                              </Badge>
                              {sub.submittedAt && (
                                <span className="text-[9px] text-muted-foreground">
                                  {format(new Date(sub.submittedAt), 'MMM dd')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {sub.filePath && (
                              <a href={`${SERVER_BASE_URL}${sub.filePath}`} target="_blank">
                                <Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="h-3.3 w-3.5" /></Button>
                              </a>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openGradingDialog(sub)}>
                              <CheckCircle2 className={`h-3.5 w-3.5 ${sub.status === 'GRADED' ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Grade Submission</DialogTitle>
                      <DialogDescription>
                        {selectedSubmission?.student?.user?.firstName}'s work for "{assignmentDetails.title}"
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGradeSubmission} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="grade">Grade / Score</Label>
                        <Input
                          id="grade"
                          placeholder="e.g. A, 85/100, Excellent"
                          value={gradeForm.grade}
                          onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea
                          id="feedback"
                          placeholder="Provide comments for the student..."
                          value={gradeForm.feedback}
                          onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setGradingDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Grade
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-muted-foreground">Submission Tracker</h3>
              <p className="text-xs text-muted-foreground/70 max-w-[200px] mt-1">Select an assignment to view and grade student work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
