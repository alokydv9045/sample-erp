'use client';

import { useState, useEffect, Suspense } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus, Search, Phone, Mail, User, Calendar,
    MessageSquare, MoreVertical, Filter, ArrowRightLeft,
    CheckCircle2, Clock, AlertCircle, Trash2, Loader2
} from 'lucide-react';
import { enquiryAPI, academicAPI } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

function EnquiryPageContent() {

    const searchParams = useSearchParams();
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Create Enquiry Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEnquiry, setNewEnquiry] = useState({
        studentName: '',
        parentName: '',
        phone: '',
        email: '',
        classId: '',
        academicYearId: '',
        source: 'WALK_IN'
    });

    // Follow-up Modal
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [followUpData, setFollowUpData] = useState({
        remark: '',
        nextFollowUpDate: ''
    });

    // Masters
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id && enquiries.length > 0) {
            const enq = enquiries.find(e => e.id === id);
            if (enq) {
                setSelectedEnquiry(enq);
                setIsFollowUpModalOpen(true);
            }
        }
    }, [searchParams, enquiries]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [enqRes, classRes, yearRes] = await Promise.all([
                enquiryAPI.getAll(),
                academicAPI.getClasses(),
                academicAPI.getAcademicYears()
            ]);

            if (enqRes.success) setEnquiries(enqRes.enquiries);
            setClasses(classRes.classes || []);
            setAcademicYears(yearRes.academicYears || []);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateEnquiry = async () => {
        try {
            const res = await enquiryAPI.create(newEnquiry);
            if (res.success) {
                toast.success('Enquiry added successfully');
                setIsAddModalOpen(false);
                loadInitialData();
                setNewEnquiry({
                    studentName: '', parentName: '', phone: '', email: '',
                    classId: '', academicYearId: '', source: 'WALK_IN'
                });
            }
        } catch (error) {
            toast.error('Failed to create enquiry');
        }
    };

    const handleAddFollowUp = async () => {
        try {
            const res = await enquiryAPI.addFollowUp(selectedEnquiry.id, followUpData);
            if (res.success) {
                toast.success('Follow-up logged');
                setIsFollowUpModalOpen(false);
                loadInitialData();
                setFollowUpData({ remark: '', nextFollowUpDate: '' });
            }
        } catch (error) {
            toast.error('Failed to log follow-up');
        }
    };

    const filteredEnquiries = enquiries.filter(enq => {
        const matchesSearch =
            enq.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enq.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'ALL' || enq.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <Badge variant="secondary" className="bg-slate-100 text-slate-800">Pending</Badge>;
            case 'FOLLOW_UP': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Follow-up</Badge>;
            case 'CONVERTED': return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Converted</Badge>;
            case 'CLOSED': return <Badge variant="secondary" className="bg-slate-50 text-slate-500">Closed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Enquiry Management</h1>
                    <p className="text-muted-foreground">Track and convert admission leads.</p>
                </div>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> New Enquiry
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>New Admission Enquiry</DialogTitle>
                            <DialogDescription>Capture prospective student details.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Student Name</label>
                                    <Input
                                        placeholder="Full Name"
                                        value={newEnquiry.studentName}
                                        onChange={(e) => setNewEnquiry({ ...newEnquiry, studentName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Parent/Guardian</label>
                                    <Input
                                        placeholder="Parent Name"
                                        value={newEnquiry.parentName}
                                        onChange={(e) => setNewEnquiry({ ...newEnquiry, parentName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input
                                        placeholder="10 digit number"
                                        value={newEnquiry.phone}
                                        onChange={(e) => setNewEnquiry({ ...newEnquiry, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email (Optional)</label>
                                    <Input
                                        placeholder="email@example.com"
                                        value={newEnquiry.email}
                                        onChange={(e) => setNewEnquiry({ ...newEnquiry, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Target Class</label>
                                    <Select onValueChange={(val) => setNewEnquiry({ ...newEnquiry, classId: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Academic Year</label>
                                    <Select onValueChange={(val) => setNewEnquiry({ ...newEnquiry, academicYearId: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Enquiry Source</label>
                                <Select value={newEnquiry.source} onValueChange={(val) => setNewEnquiry({ ...newEnquiry, source: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WALK_IN">Walk-in</SelectItem>
                                        <SelectItem value="WEBSITE">Website</SelectItem>
                                        <SelectItem value="REFERRAL">Referral</SelectItem>
                                        <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateEnquiry}>Save Enquiry</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by student or phone..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                            <SelectItem value="CONVERTED">Converted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="shadow-sm border-none bg-slate-50/50">
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-100/50">
                            <TableRow>
                                <TableHead className="font-bold">Student Detail</TableHead>
                                <TableHead className="font-bold">Class & Year</TableHead>
                                <TableHead className="font-bold">Contact</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading enquiries...</TableCell>
                                </TableRow>
                            ) : filteredEnquiries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No enquiries found.</TableCell>
                                </TableRow>
                            ) : filteredEnquiries.map((enq) => (
                                <TableRow key={enq.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell>
                                        <div className="font-semibold">{enq.studentName}</div>
                                        <div className="text-xs text-muted-foreground">P: {enq.parentName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{enq.class?.name}</div>
                                        <div className="text-xs text-muted-foreground">{enq.academicYear?.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Phone className="h-3 w-3 text-primary" /> {enq.phone}
                                            </div>
                                            {enq.email && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" /> {enq.email}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(enq.status)}
                                        {enq._count.followUps > 0 && (
                                            <span className="ml-2 text-[10px] text-muted-foreground font-medium">
                                                ({enq._count.followUps} logs)
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(enq.createdAt), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:text-blue-600"
                                                onClick={() => {
                                                    setSelectedEnquiry(enq);
                                                    setIsFollowUpModalOpen(true);
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:text-green-600"
                                                disabled={enq.status === 'CONVERTED'}
                                                asChild
                                            >
                                                <a href={`/dashboard/students/register?enquiryId=${enq.id}`}>
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Follow-up Logging Modal */}
            <Dialog open={isFollowUpModalOpen} onOpenChange={setIsFollowUpModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log Follow-up</DialogTitle>
                        <DialogDescription>Recording interactions with {selectedEnquiry?.studentName}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Staff Remark</label>
                            <Textarea
                                placeholder="Details of the conversation, concerns, or interests..."
                                value={followUpData.remark}
                                onChange={(e) => setFollowUpData({ ...followUpData, remark: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Next Follow-up Date (Optional)</label>
                            <Input
                                type="date"
                                value={followUpData.nextFollowUpDate}
                                onChange={(e) => setFollowUpData({ ...followUpData, nextFollowUpDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddFollowUp}>Save & Mark Active</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function EnquiryPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading enquiries...</span>
            </div>
        }>
            <EnquiryPageContent />
        </Suspense>
    );
}
