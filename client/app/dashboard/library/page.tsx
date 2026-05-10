'use client';

import { useEffect, useState, useCallback } from 'react';
import { libraryAPI, dashboardAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';
import { 
  Search, Plus, Loader2, BookOpen, BookCheck, BookX, 
  BarChart3, PieChart as PieChartIcon, History, CalendarClock, 
  RotateCcw, CheckCircle2, AlertTriangle, Filter
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const { canManageLibrary } = usePermissions();
  const { toast } = useToast();

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    type: 'PHYSICAL',
    condition: 'NEW',
    totalCopies: '',
    shelfLocation: '',
  });

  const [issueForm, setIssueForm] = useState({
    studentId: '',
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const [returnForm, setReturnForm] = useState({
    conditionOnReturn: 'GOOD',
    remarks: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [booksData, issuesData, reservationsData, statsRes] = await Promise.all([
        libraryAPI.getBooks(),
        libraryAPI.getIssues({ status: 'ISSUED' }),
        libraryAPI.getReservations({ status: 'PENDING' }),
        dashboardAPI.getLibraryStats()
      ]);

      setBooks(booksData.books || []);
      setIssues(issuesData.issues || []);
      setReservations(reservationsData.reservations || []);
      
      if (statsRes.success) {
        setStats(statsRes.summary);
      }
    } catch (err) {
      console.error('Failed to fetch library data', err);
      toast({ title: 'Error', description: 'Failed to load library data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        // Triggered by socket: LIBRARY_BOOK_CREATED, LIBRARY_BOOK_UPDATED, LIBRARY_BOOK_ISSUED, LIBRARY_BOOK_RETURNED
        fetchData();
      };

      socket.on('LIBRARY_BOOK_CREATED', handleUpdate);
      socket.on('LIBRARY_BOOK_UPDATED', handleUpdate);
      socket.on('LIBRARY_BOOK_ISSUED', handleUpdate);
      socket.on('LIBRARY_BOOK_RETURNED', handleUpdate);

      return () => {
        socket.off('LIBRARY_BOOK_CREATED', handleUpdate);
        socket.off('LIBRARY_BOOK_UPDATED', handleUpdate);
        socket.off('LIBRARY_BOOK_ISSUED', handleUpdate);
        socket.off('LIBRARY_BOOK_RETURNED', handleUpdate);
      };
    }
  }, [socket, fetchData]);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await libraryAPI.createBook({
        ...bookForm,
        totalCopies: parseInt(bookForm.totalCopies),
      });
      setIsDialogOpen(false);
      setBookForm({ title: '', author: '', isbn: '', category: '', type: 'PHYSICAL', condition: 'NEW', totalCopies: '', shelfLocation: '' });
      fetchData();
      toast({ title: 'Success', description: 'Book added to catalog' });
    } catch (err) {
      console.error('Failed to create book', err);
      toast({ title: 'Error', description: 'Failed to add book', variant: 'destructive' });
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      await libraryAPI.issueBook({
        bookId: selectedBook.id,
        studentId: issueForm.studentId,
        dueDate: issueForm.dueDate,
      });
      setIsIssueDialogOpen(false);
      setIssueForm({ studentId: '', dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') });
      setSelectedBook(null);
      fetchData();
      toast({ title: 'Success', description: 'Book issued successfully' });
    } catch (err) {
      console.error('Failed to issue book', err);
      toast({ title: 'Error', description: 'Failed to issue book', variant: 'destructive' });
    }
  };

  const [historyBook, setHistoryBook] = useState<any>(null);
  const [bookHistory, setBookHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchBookHistory = async (book: any) => {
    setHistoryBook(book);
    setIsHistoryLoading(true);
    try {
      const data = await libraryAPI.getIssues({ bookId: book.id });
      setBookHistory(data.issues || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load history', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsHistoryLoading(false);
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
      fetchData();
      toast({ title: 'Success', description: 'Book returned successfully' });
    } catch (err) {
      console.error('Failed to return book', err);
      toast({ title: 'Error', description: 'Failed to process return', variant: 'destructive' });
    }
  };

  const handleRenewBook = async (issueId: string) => {
    try {
      await libraryAPI.renewBook({ issueId });
      fetchData();
      toast({ title: 'Success', description: 'Book renewal successful' });
    } catch (err) {
      console.error('Failed to renew book', err);
      toast({ title: 'Error', description: 'Renewal limit reached or failed', variant: 'destructive' });
    }
  };

  const filteredBooks = books.filter((book) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      book.title?.toLowerCase().includes(searchLower) ||
      book.author?.toLowerCase().includes(searchLower) ||
      book.isbn?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Hub</h1>
          <p className="text-muted-foreground">Comprehensive book circulation and catalog management</p>
        </div>
        {canManageLibrary && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/library/overdue">
                <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                Overdue
              </a>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Expand the library collection with new items</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBook} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="title">Book Title *</Label>
                    <Input id="title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input id="author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input id="isbn" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input id="category" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Book Type</Label>
                    <Select value={bookForm.type} onValueChange={(v) => setBookForm({ ...bookForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHYSICAL">Physical Copy</SelectItem>
                        <SelectItem value="EBOOK">E-Book</SelectItem>
                        <SelectItem value="REFERENCE">Reference Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCopies">Total Copies *</Label>
                    <Input id="totalCopies" type="number" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelfLocation">Shelf Location</Label>
                    <Input id="shelfLocation" value={bookForm.shelfLocation} onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })} placeholder="e.g. A-102" />
                  </div>
                  <div className="col-span-2 pt-4">
                    <Button type="submit" className="w-full">Register Book</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats Quick View */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total books', val: stats?.totalBooks || books.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Available', val: stats?.availableBooks || '-', icon: BookCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Currently Issued', val: stats?.issuedBooks || issues.length, icon: CalendarClock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Overdue items', val: stats?.overdueBooks || '-', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <Card key={i} className={`${s.bg}/50 border-none shadow-sm`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold">{s.val}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
          <TabsTrigger value="issues">Active Issues</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div>
                <CardTitle>Library Catalog</CardTitle>
                <CardDescription>Browse and manage all registered books</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search books..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Info</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell>
                            <div className="font-semibold">{book.title}</div>
                            <div className="text-xs text-muted-foreground">{book.author} | ISBN: {book.isbn || 'N/A'}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{book.type}</Badge></TableCell>
                          <TableCell>{book.category}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${book.availableCopies === 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {book.availableCopies}/{book.totalCopies}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={book.status === 'AVAILABLE' ? 'success' : 'secondary' as any}>
                              {book.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {/* History Dialog */}
                              <Dialog open={!!historyBook && historyBook.id === book.id} onOpenChange={(open) => !open && setHistoryBook(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="View History" onClick={() => fetchBookHistory(book)}>
                                    <History className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Circulation History</DialogTitle>
                                    <DialogDescription>Past issues and returns for "{historyBook?.title}"</DialogDescription>
                                  </DialogHeader>
                                  {isHistoryLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6" /></div>
                                  ) : (
                                    <div className="max-h-[400px] overflow-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Borrower</TableHead>
                                            <TableHead>Issued</TableHead>
                                            <TableHead>Returned</TableHead>
                                            <TableHead>Condition</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {bookHistory.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-4">No history records</TableCell></TableRow>
                                          ) : (
                                            bookHistory.map(h => (
                                              <TableRow key={h.id}>
                                                <TableCell className="text-xs">
                                                  {h.student ? `${h.student.user?.firstName} ${h.student.user?.lastName}` : 'Staff'}
                                                </TableCell>
                                                <TableCell className="text-xs">{new Date(h.issueDate).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-xs">{h.returnDate ? new Date(h.returnDate).toLocaleDateString() : 'Active'}</TableCell>
                                                <TableCell className="text-xs">{h.conditionOnReturn || '-'}</TableCell>
                                              </TableRow>
                                            ))
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {/* Issue Dialog */}
                              <Dialog open={isIssueDialogOpen && selectedBook?.id === book.id} onOpenChange={(open) => {
                                setIsIssueDialogOpen(open);
                                if (!open) setSelectedBook(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedBook(book)} disabled={book.availableCopies === 0}>
                                    Issue
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Issue Book</DialogTitle>
                                    <DialogDescription>Assigning "{book.title}" to a student</DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={handleIssueBook} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                      <Label>Student Admission Number</Label>
                                      <Input value={issueForm.studentId} onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })} placeholder="Enter number..." required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Due Date</Label>
                                      <Input type="date" value={issueForm.dueDate} onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })} required />
                                    </div>
                                    <Button type="submit" className="w-full">Confirm Issue</Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
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

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Active Circulation</CardTitle>
              <CardDescription>Monitor and process currently issued books</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Renewals</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No active issues found</TableCell></TableRow>
                    ) : (
                      issues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell>
                            <div className="font-semibold">{issue.student?.user?.firstName} {issue.student?.user?.lastName}</div>
                            <div className="text-xs text-muted-foreground">ID: {issue.student?.admissionNumber}</div>
                          </TableCell>
                          <TableCell>{issue.book?.title}</TableCell>
                          <TableCell>{new Date(issue.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={new Date(issue.dueDate) < new Date() ? 'text-red-500 font-bold' : ''}>
                              {new Date(issue.dueDate).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>{issue.renewalCount} / 2</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleRenewBook(issue.id)} disabled={issue.renewalCount >= 2}>
                              <RotateCcw className="h-4 w-4 mr-1" /> Renew
                            </Button>
                            <Dialog open={isReturnDialogOpen && selectedIssue?.id === issue.id} onOpenChange={(open) => {
                              setIsReturnDialogOpen(open);
                              if (!open) setSelectedIssue(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedIssue(issue)}>
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Return
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Return Book</DialogTitle>
                                  <DialogDescription>Process return for "{issue.book?.title}"</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleReturnBook} className="space-y-4 pt-4">
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
                                  <Button type="submit" className="w-full">Process Return</Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>Waitlist & Reservations</CardTitle>
              <CardDescription>Manage book reservation requests from students and teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requester</TableHead>
                      <TableHead>Book Requested</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No active reservations</TableCell></TableRow>
                    ) : (
                      reservations.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell>
                            <div className="font-semibold">
                              {res.student ? `${res.student.user?.firstName} ${res.student.user?.lastName}` : 
                               res.teacher ? `${res.teacher.user?.firstName} ${res.teacher.user?.lastName}` : 'Unknown'}
                            </div>
                            <div className="text-xs text-muted-foreground">{res.student ? 'Student' : 'Staff'}</div>
                          </TableCell>
                          <TableCell>{res.book?.title}</TableCell>
                          <TableCell>{new Date(res.reservationDate).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant="outline">{res.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-red-500">Cancel</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <RealtimeChart
              title="Borrowing Trends"
              description="Monthly book issue frequency"
              endpoint="/dashboard/library-stats"
              socketEvent="LIBRARY_UPDATE"
              type="area"
              dataKey="count"
              xAxisKey="month"
              color="#3b82f6"
            />
            <RealtimeChart
              title="Book Categories"
              description="Distribution by genre"
              endpoint="/dashboard/library-stats"
              socketEvent="LIBRARY_UPDATE"
              type="pie"
              dataKey="value"
              xAxisKey="name"
              colors={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
