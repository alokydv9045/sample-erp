'use client';

import { useState, useEffect, useCallback } from 'react';
import { assignmentAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  FileText,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Upload,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SERVER_BASE_URL } from '@/lib/api/apiConfig';
import { format, isAfter } from 'date-fns';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await assignmentAPI.getStudentAssignments();
      setAssignments(res.assignments || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch assignments', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !file) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment.id);
      formData.append('file', file);

      await assignmentAPI.submitAssignment(formData);
      toast({ title: 'Success', description: 'Assignment submitted successfully' });
      setSubmissionDialogOpen(false);
      setFile(null);
      fetchAssignments();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to submit assignment', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (assignment: any) => {
    const submission = assignment.submissions?.[0];
    if (submission) {
      if (submission.status === 'GRADED') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Graded</Badge>;
      if (submission.status === 'LATE') return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Late</Badge>;
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Submitted</Badge>;
    }
    
    const isOverdue = isAfter(new Date(), new Date(assignment.dueDate));
    if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
        <p className="text-muted-foreground">View and submit your classwork</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Assignments</CardTitle>
            <CardDescription>Click on an assignment to submit your work or view grades.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-20 border rounded-xl border-dashed bg-muted/20">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                <p className="text-muted-foreground font-medium">No assignments found for your class.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((item) => {
                  const submission = item.submissions?.[0];
                  const isOverdue = !submission && isAfter(new Date(), new Date(item.dueDate));
                  
                  return (
                    <Card key={item.id} className={`group relative transition-all hover:shadow-md ${submission?.status === 'GRADED' ? 'border-green-200 bg-green-50/10' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">{item.subject?.name}</Badge>
                          {getStatusBadge(item)}
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs min-h-[32px]">
                          {item.description || "No instructions provided."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center text-xs text-muted-foreground gap-3">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {format(new Date(item.dueDate), 'MMM dd')}
                          </div>
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {item.teacher?.user?.firstName}
                          </div>
                        </div>

                        {item.filePath && (
                          <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-[10px] font-medium">
                            <span className="flex items-center"><FileText className="h-3 w-3 mr-1 text-primary" /> Reference Mat.</span>
                            <a 
                              href={`${SERVER_BASE_URL}${item.filePath}`} 
                              target="_blank" 
                              className="text-primary hover:underline flex items-center"
                            >
                              Download <ExternalLink className="h-2 w-2 ml-1" />
                            </a>
                          </div>
                        )}

                        {submission && submission.grade && (
                          <div className="mt-2 p-3 rounded-lg bg-green-100/50 border border-green-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] uppercase font-bold text-green-700">Result</span>
                              <span className="text-sm font-bold text-green-800">{submission.grade}</span>
                            </div>
                            {submission.feedback && (
                              <p className="text-[10px] italic text-green-700 line-clamp-2">"{submission.feedback}"</p>
                            )}
                          </div>
                        )}

                        {!submission && (
                          <Dialog open={submissionDialogOpen && selectedAssignment?.id === item.id} onOpenChange={(open) => {
                            setSubmissionDialogOpen(open);
                            if (open) setSelectedAssignment(item);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant={isOverdue ? "destructive" : "default"} className="w-full h-9 text-xs" onClick={() => setSelectedAssignment(item)}>
                                <Upload className="h-3 w-3 mr-2" />
                                {isOverdue ? "Submit Late" : "Submit Assignment"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px]">
                              <DialogHeader>
                                <DialogTitle>Submit Work</DialogTitle>
                                <DialogDescription>
                                  Uploading submission for "{item.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSubmitWork} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="file">Select File</Label>
                                  <Input
                                    id="file"
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required
                                  />
                                  <p className="text-[10px] text-muted-foreground flex items-center">
                                    <AlertCircle className="h-2 w-2 mr-1" /> Max 10MB.
                                  </p>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                  <Button type="button" variant="outline" onClick={() => setSubmissionDialogOpen(false)}>Cancel</Button>
                                  <Button type="submit" disabled={isSubmitting || !file}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Submit
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}

                        {submission && !submission.grade && (
                          <div className="flex items-center justify-center p-2 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                            <Clock className="h-3 w-3 mr-2" />
                            Awaiting Grade
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
