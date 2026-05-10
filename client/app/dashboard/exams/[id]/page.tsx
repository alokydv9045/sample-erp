'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { examAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Save,
  ArrowLeft,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Trash2,
  FileSpreadsheet,
  FileUp,
  Calendar,
  AlertTriangle,
  ClipboardCheck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from '@/hooks/usePermissions';
import * as XLSX from 'xlsx';

interface MarkEntry {
  studentId: string;
  studentName: string;
  admissionNo: string;
  theoryObtained: number;
  practicalObtained: number;
  internalObtained: number;
  total: number;
  grade: string;
  isAbsent: boolean;
  absenceType: string;
  errors: Record<string, string>;
}

function ExamDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isTeacher, isAdmin, canEnterMarks, canCreateExams } = usePermissions();

  const [exam, setExam] = useState<any>(null);
  const [consolidated, setConsolidated] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Marks entry state
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedSubjectMeta, setSelectedSubjectMeta] = useState<any>(null);

  // Bulk Upload state
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  const buildSubjectMarks = useCallback((subjectId: string, data: any) => {
    if (!data || !subjectId) return { meta: null, entries: [] };
    const subjectMeta = data.subjectProgress?.find((s: any) => s.subjectId === subjectId);
    const entries: MarkEntry[] = (data.results || []).map((r: any) => {
      const existingMark = r.marks?.find((m: any) => m.subjectId === subjectId);
      return {
        studentId: r.studentId,
        studentName: r.studentName,
        admissionNo: r.admissionNo || '-',
        theoryObtained: existingMark?.theoryObtained || 0,
        practicalObtained: existingMark?.practicalObtained || 0,
        internalObtained: existingMark?.internalObtained || 0,
        total: existingMark?.obtainedMarks || 0,
        grade: existingMark?.grade || '-',
        isAbsent: existingMark?.isAbsent || false,
        absenceType: existingMark?.absenceType || 'ABSENT',
        errors: {},
      };
    });
    return { meta: subjectMeta, entries };
  }, []);

  const handleSubjectSelect = useCallback((subjectId: string, customConsolidated?: any) => {
    const activeConsolidated = customConsolidated || consolidated;
    setSelectedSubjectId(subjectId);
    setSaveMessage('');
    setUploadError('');
    setUploadSuccess('');

    const { meta, entries } = buildSubjectMarks(subjectId, activeConsolidated);
    setSelectedSubjectMeta(meta);
    setMarkEntries(entries);
  }, [consolidated, buildSubjectMarks]);

  const fetchExamData = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const [examRes, consolidatedRes] = await Promise.all([
        examAPI.getById(id),
        examAPI.getConsolidated(id).catch(() => null),
      ]);
      setExam(examRes.exam);
      setConsolidated(consolidatedRes);

      // Pick subject from query OR first subject
      if (consolidatedRes?.subjectProgress?.length > 0) {
        const querySubjectId = searchParams.get('subject');
        const initialSubjectId = querySubjectId || consolidatedRes.subjectProgress[0].subjectId;

        setSelectedSubjectId(initialSubjectId);
        const { meta, entries } = buildSubjectMarks(initialSubjectId, consolidatedRes);
        setSelectedSubjectMeta(meta);
        setMarkEntries(entries);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch exam details');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, buildSubjectMarks]);

  useEffect(() => {
    if (params.id) {
      fetchExamData(params.id as string);
    }
  }, [params.id, fetchExamData]);

  const handleMarkChange = (index: number, field: string, value: any) => {
    setMarkEntries(prev => {
      const updated = [...prev];
      const entry = { ...updated[index] };

      if (field === 'isAbsent') {
        entry.isAbsent = value;
        if (value) {
          entry.theoryObtained = 0;
          entry.practicalObtained = 0;
          entry.internalObtained = 0;
          entry.total = 0;
          entry.grade = entry.absenceType === 'MEDICAL' ? 'MED' : 'AB';
          entry.errors = {};
        }
      } else if (field === 'absenceType') {
        entry.absenceType = value;
        if (entry.isAbsent) {
          entry.grade = value === 'MEDICAL' ? 'MED' : 'AB';
        }
      } else {
        const numVal = parseFloat(value) || 0;
        (entry as any)[field] = numVal;

        const newErrors = { ...entry.errors };
        if (field === 'theoryObtained' && selectedSubjectMeta?.theoryMax > 0 && numVal > selectedSubjectMeta.theoryMax) {
          newErrors.theoryObtained = `Max ${selectedSubjectMeta.theoryMax}`;
        } else if (field === 'theoryObtained') {
          delete newErrors.theoryObtained;
        }

        if (field === 'practicalObtained' && selectedSubjectMeta?.practicalMax > 0 && numVal > selectedSubjectMeta.practicalMax) {
          newErrors.practicalObtained = `Max ${selectedSubjectMeta.practicalMax}`;
        } else if (field === 'practicalObtained') {
          delete newErrors.practicalObtained;
        }

        if (field === 'internalObtained' && selectedSubjectMeta?.internalMax > 0 && numVal > selectedSubjectMeta.internalMax) {
          newErrors.internalObtained = `Max ${selectedSubjectMeta.internalMax}`;
        } else if (field === 'internalObtained') {
          delete newErrors.internalObtained;
        }
        entry.errors = newErrors;
        entry.total = entry.theoryObtained + entry.practicalObtained + entry.internalObtained;
      }

      updated[index] = entry;
      return updated;
    });
  };

  const hasValidationErrors = markEntries.some(e => Object.keys(e.errors).length > 0);

  const handleSaveMarks = async () => {
    if (hasValidationErrors || !selectedSubjectId || exam?.isFrozen) return;
    try {
      setIsSaving(true);
      setSaveMessage('');

      const marksPayload = markEntries.map(e => ({
        studentId: e.studentId,
        theoryObtained: e.theoryObtained,
        practicalObtained: e.practicalObtained,
        internalObtained: e.internalObtained,
        isAbsent: e.isAbsent,
        absenceType: e.isAbsent ? e.absenceType : undefined,
      }));

      const result = await examAPI.enterMarks(params.id as string, {
        subjectId: selectedSubjectId,
        marks: marksPayload,
      });

      setSaveMessage(`✅ ${result.message}`);
      const freshData = await examAPI.getConsolidated(params.id as string).catch(() => null);
      setConsolidated(freshData);
    } catch (err: any) {
      setSaveMessage(`❌ ${err.response?.data?.error || 'Failed to save marks'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFreezeToggle = async () => {
    try {
      setIsProcessing(true);
      if (exam.isFrozen) {
        await examAPI.unfreeze(exam.id);
      } else {
        await examAPI.freeze(exam.id);
      }
      fetchExamData(params.id as string);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedSubjectId || !selectedSubjectMeta) return;
    const templateData = markEntries.map(e => ({
      'Roll No': e.admissionNo,
      'Student Name': e.studentName,
      'Theory Marks': e.theoryObtained || '',
      'Practical Marks': e.practicalObtained || '',
      'Internal Marks': e.internalObtained || '',
      'Is Absent (Y/N)': e.isAbsent ? 'Y' : 'N',
      'Absence Type': e.isAbsent ? e.absenceType : '',
    }));
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, `${exam.name}_${selectedSubjectMeta.subjectName}_Template.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadSuccess('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) throw new Error("File is empty");
        setMarkEntries(prev => {
          return prev.map(entry => {
            const row: any = data.find((r: any) => r['Roll No']?.toString() === entry.admissionNo);
            if (row) {
              const isAbsent = row['Is Absent (Y/N)']?.toUpperCase() === 'Y';
              const theory = parseFloat(row['Theory Marks']) || 0;
              const practical = parseFloat(row['Practical Marks']) || 0;
              const internal = parseFloat(row['Internal Marks']) || 0;
              const errors: Record<string, string> = {};
              if (selectedSubjectMeta?.theoryMax > 0 && theory > selectedSubjectMeta.theoryMax) errors.theoryObtained = `Exceeds ${selectedSubjectMeta.theoryMax}`;
              if (selectedSubjectMeta?.practicalMax > 0 && practical > selectedSubjectMeta.practicalMax) errors.practicalObtained = `Exceeds ${selectedSubjectMeta.practicalMax}`;
              if (selectedSubjectMeta?.internalMax > 0 && internal > selectedSubjectMeta.internalMax) errors.internalObtained = `Exceeds ${selectedSubjectMeta.internalMax}`;
              return {
                ...entry,
                theoryObtained: isAbsent ? 0 : theory,
                practicalObtained: isAbsent ? 0 : practical,
                internalObtained: isAbsent ? 0 : internal,
                isAbsent: isAbsent,
                absenceType: isAbsent ? row['Absence Type'] || 'ABSENT' : 'ABSENT',
                total: isAbsent ? 0 : (theory + practical + internal),
                errors: errors
              };
            }
            return entry;
          });
        });
        setUploadSuccess(`Imported marks for ${data.length} students. Please review and Save.`);
      } catch (err) {
        setUploadError('Invalid file format. Please use the downloaded template.');
      }
    };
    reader.readAsBinaryString(file);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/exams"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{exam.name}</h1>
            <p className="text-muted-foreground">{exam.class?.name} • {exam.academicYear?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant={exam.isFrozen ? "destructive" : "outline"} onClick={handleFreezeToggle} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : exam.isFrozen ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
              {exam.isFrozen ? 'Unfreeze Results' : 'Freeze Results'}
            </Button>
          )}
          {isTeacher && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/exams/${exam.id}/review`}><ClipboardCheck className="mr-2 h-4 w-4" /> Class Review</Link>
            </Button>
          )}
        </div>
      </div>

      {exam.isFrozen && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          <Lock className="h-4 w-4" />
          <span>Results are frozen. Marks entry is disabled. Contact Principal to unfreeze.</span>
        </div>
      )}

      {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>}

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="marks">Marks Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader><CardTitle>Subject Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Theory</TableHead>
                      <TableHead>Practical</TableHead>
                      <TableHead>Internal</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.examSubjects?.map((es: any) => (
                      <TableRow key={es.id}>
                        <TableCell className="font-medium">{es.subject?.name}</TableCell>
                        <TableCell>{new Date(es.examDate).toLocaleDateString()}</TableCell>
                        <TableCell>{es.startTime}</TableCell>
                        <TableCell>{es.theoryMaxMarks}</TableCell>
                        <TableCell>{es.practicalMaxMarks}</TableCell>
                        <TableCell>{es.internalMaxMarks}</TableCell>
                        <TableCell className="font-bold">{es.totalMarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div><CardTitle>Manual Marks Entry</CardTitle><CardDescription>Enter student marks for the selected subject.</CardDescription></div>
              <div className="flex items-center gap-3">
                <Select value={selectedSubjectId} onValueChange={(v) => handleSubjectSelect(v)}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {consolidated?.subjectProgress?.map((s: any) => <SelectItem key={s.subjectId} value={s.subjectId}>{s.subjectName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleSaveMarks} disabled={isSaving || exam.isFrozen || !canEnterMarks || hasValidationErrors}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {saveMessage && <div className={`mb-4 p-3 rounded-md text-sm ${saveMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{saveMessage}</div>}
              {!selectedSubjectId ? <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">Select a subject to begin</div> : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="w-[100px]">Theory ({selectedSubjectMeta?.theoryMax})</TableHead>
                        <TableHead className="w-[100px]">Prac ({selectedSubjectMeta?.practicalMax})</TableHead>
                        <TableHead className="w-[100px]">Int ({selectedSubjectMeta?.internalMax})</TableHead>
                        <TableHead className="w-[80px]">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {markEntries.map((entry, idx) => (
                        <TableRow key={entry.studentId} className={entry.isAbsent ? "bg-muted/30" : ""}>
                          <TableCell><p className="font-medium text-sm">{entry.studentName}</p><p className="text-[10px] text-muted-foreground">{entry.admissionNo}</p></TableCell>
                          <TableCell>
                            <Input type="number" value={entry.theoryObtained} onChange={(e) => handleMarkChange(idx, 'theoryObtained', e.target.value)} disabled={exam.isFrozen || entry.isAbsent} className={`h-8 text-sm ${entry.errors.theoryObtained ? 'border-red-500' : ''}`} />
                            {entry.errors.theoryObtained && <p className="text-[10px] text-red-500">{entry.errors.theoryObtained}</p>}
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={entry.practicalObtained} onChange={(e) => handleMarkChange(idx, 'practicalObtained', e.target.value)} disabled={exam.isFrozen || entry.isAbsent} className={`h-8 text-sm ${entry.errors.practicalObtained ? 'border-red-500' : ''}`} />
                            {entry.errors.practicalObtained && <p className="text-[10px] text-red-500">{entry.errors.practicalObtained}</p>}
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={entry.internalObtained} onChange={(e) => handleMarkChange(idx, 'internalObtained', e.target.value)} disabled={exam.isFrozen || entry.isAbsent} className={`h-8 text-sm ${entry.errors.internalObtained ? 'border-red-500' : ''}`} />
                            {entry.errors.internalObtained && <p className="text-[10px] text-red-500">{entry.errors.internalObtained}</p>}
                          </TableCell>
                          <TableCell className="font-bold text-sm">{entry.isAbsent ? 'AB' : entry.total}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={entry.isAbsent} onChange={(e) => handleMarkChange(idx, 'isAbsent', e.target.checked)} disabled={exam.isFrozen} />
                              {entry.isAbsent && (
                                <select className="text-[10px] border rounded" value={entry.absenceType} onChange={(e) => handleMarkChange(idx, 'absenceType', e.target.value)} disabled={exam.isFrozen}>
                                  <option value="ABSENT">Absent</option><option value="MEDICAL">Medical</option><option value="EXEMPTED">Exempt</option>
                                </select>
                              )}
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
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Excel Bulk Upload</CardTitle><CardDescription>Upload marks using Excel</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50/30">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Download className="h-4 w-4" /> 1. Download Template</h3>
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={!selectedSubjectId}>Download XLSX</Button>
                </div>
                <div className="space-y-3 p-4 border rounded-lg bg-green-50/30">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> 2. Upload File</h3>
                  <Input type="file" accept=".xlsx" onChange={handleFileUpload} disabled={exam.isFrozen || !selectedSubjectId} />
                </div>
              </div>
              {uploadError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{uploadError}</div>}
              {uploadSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs rounded border border-green-200">{uploadSuccess}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Consolidated View</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead><TableHead>Student</TableHead>
                      {consolidated?.subjectProgress?.map((s: any) => <TableHead key={s.subjectId}>{s.subjectName.substring(0, 3)}</TableHead>)}
                      <TableHead>Total</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidated?.results?.map((r: any) => (
                      <TableRow key={r.studentId}>
                        <TableCell className="font-bold">{r.rank}</TableCell><TableCell className="text-sm">{r.studentName}</TableCell>
                        {consolidated.subjectProgress.map((s: any) => {
                          const m = r.marks.find((mk: any) => mk.subjectId === s.subjectId);
                          return <TableCell key={s.subjectId} className="text-xs">{m ? (m.isAbsent ? 'AB' : m.obtainedMarks) : '-'}</TableCell>
                        })}
                        <TableCell className="font-bold text-sm">{r.obtainedMarks}</TableCell><TableCell className="text-sm">{r.percentage}%</TableCell>
                        <TableCell><Badge variant="outline">{r.grade}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ExamDetailPage() {
  return (
    <Suspense fallback={<div>Loading Exam Details...</div>}>
      <ExamDetailContent />
    </Suspense>
  );
}
