'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { libraryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OverdueBooksPage() {
  const [overdueBooks, setOverdueBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const { toast } = useToast();

  const [returnForm, setReturnForm] = useState({
    conditionOnReturn: 'GOOD',
    remarks: '',
  });

  useEffect(() => {
    fetchOverdueBooks();
  }, []);

  const fetchOverdueBooks = async () => {
    try {
      setIsLoading(true);
      const data = await libraryAPI.getOverdue();
      setOverdueBooks(data.issues || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch overdue books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      await libraryAPI.returnBook({
        issueId: selectedIssue.id,
        conditionOnReturn: returnForm.conditionOnReturn,
        remarks: returnForm.remarks,
      });
      setIsReturnDialogOpen(false);
      setReturnForm({ conditionOnReturn: 'GOOD', remarks: '' });
      setSelectedIssue(null);
      fetchOverdueBooks();
      toast({ title: 'Success', description: 'Book returned and fine processed' });
    } catch (err) {
      console.error('Failed to return book', err);
      toast({ title: 'Error', description: 'Failed to process return', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/library">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overdue Management</h1>
        <p className="text-muted-foreground">Monitor overdue returns and track penalty fines</p>
      </div>

      {/* Alert */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">
                {overdueBooks.length} book{overdueBooks.length !== 1 ? 's are' : ' is'} critically overdue
              </p>
              <p className="text-sm text-red-700">
                Total pending fines: ₹{overdueBooks.reduce((acc, curr) => acc + (curr.fine || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delinquent Returns</CardTitle>
          <CardDescription>Comprehensive list of books past their due date</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
          ) : overdueBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="mb-4 h-12 w-12 text-green-500 opacity-50" />
              <p className="text-lg font-medium">All clear!</p>
              <p className="text-sm text-muted-foreground">
                No overdue books found in the system.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Past</TableHead>
                    <TableHead>Estimated Fine</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueBooks.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">
                        <div>{issue.book?.title}</div>
                        <div className="text-xs text-muted-foreground">ISBN: {issue.book?.isbn || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {issue.student ? `${issue.student.user?.firstName} ${issue.student.user?.lastName}` : 
                           issue.teacher ? `${issue.teacher.user?.firstName} ${issue.teacher.user?.lastName}` : 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {issue.student ? `Admission: ${issue.student.admissionNumber}` : issue.teacher ? 'Staff' : ''}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(issue.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {issue.overdueDays} day{issue.overdueDays !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-red-600">₹{issue.fine}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isReturnDialogOpen && selectedIssue?.id === issue.id} onOpenChange={(open) => {
                          setIsReturnDialogOpen(open);
                          if (!open) setSelectedIssue(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedIssue(issue)}>
                              Process Return
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Finalize Return</DialogTitle>
                              <DialogDescription>Assessing book condition and fine for "{issue.book?.title}"</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleReturnBook} className="space-y-4 pt-4">
                              <div className="bg-red-50 p-3 rounded-md mb-4 border border-red-100">
                                <p className="text-sm font-semibold text-red-900">Calculated Fine: ₹{issue.fine}</p>
                                <p className="text-xs text-red-700">Days overdue: {issue.overdueDays}</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Condition on Return</Label>
                                <Select value={returnForm.conditionOnReturn} onValueChange={(v) => setReturnForm({ ...returnForm, conditionOnReturn: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="NEW">New / Mint</SelectItem>
                                    <SelectItem value="GOOD">Good / Used</SelectItem>
                                    <SelectItem value="FAIR">Fair (Visible wear)</SelectItem>
                                    <SelectItem value="POOR">Poor (Heavy wear)</SelectItem>
                                    <SelectItem value="DAMAGED">Damaged / Missing pages</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Remarks</Label>
                                <Input value={returnForm.remarks} onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })} placeholder="Internal notes..." />
                              </div>
                              <Button type="submit" className="w-full">Confirm Return & Close</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
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
  );
}
