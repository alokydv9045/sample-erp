'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { serviceAPI, ServiceRequest } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewRequestForm } from './components/NewRequestForm';

export default function ServicesPage() {
    const { user } = useAuth();
    const { isStudent } = usePermissions();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        try {
            const data = await serviceAPI.getAll();
            setRequests(data);
        } catch (error) {
            toast.error('Failed to fetch service requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        setIsDialogOpen(false);
        fetchRequests();
    };

    const handleViewRequest = (request: ServiceRequest) => {
        setSelectedRequest(request);
        setIsViewDialogOpen(true);
    };

    const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedRequest) return;
        setUpdating(true);
        try {
            await serviceAPI.update(selectedRequest.id, { status });
            toast.success(`Request ${status.toLowerCase()} successfully`);
            setIsViewDialogOpen(false);
            fetchRequests();
        } catch (err) {
            toast.error('Failed to update request');
        } finally {
            setUpdating(false);
        }
    };

    if (!user) return null;

    const pendingCount = (requests || []).filter(r => r.status === 'PENDING').length;
    const approvedCount = (requests || []).filter(r => r.status === 'APPROVED').length;
    const totalCount = (requests || []).length;

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default';
            case 'PENDING': return 'secondary';
            case 'REJECTED': return 'destructive';
            case 'RESOLVED': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Requests & Services</h1>
                    <p className="text-muted-foreground">
                        {isStudent
                            ? 'Apply for certificates, leave, and other administrative requests.'
                            : 'Manage service requests and applications.'}
                    </p>
                </div>
                {isStudent && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Service Request</DialogTitle>
                                <DialogDescription>
                                    Fill out the form below to submit a new request.
                                </DialogDescription>
                            </DialogHeader>
                            <NewRequestForm onSuccess={handleSuccess} onCancel={() => setIsDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Recently approved</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recently submitted requests and their status.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 flex justify-center text-muted-foreground">Loading requests...</div>
                    ) : (requests || []).length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="rounded-full bg-primary/10 p-6">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">No Requests Found</h3>
                            <p className="text-muted-foreground max-w-md">
                                {isStudent
                                    ? "You haven't submitted any service requests yet."
                                    : "There are no service requests to manage right now."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(requests || []).map((request) => (
                                <div key={request.id} className="flex items-start justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-semibold">{request.subject}</span>
                                            <Badge variant={getStatusBadgeVariant(request.status) as any}>{request.status}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Type: {request.type.replace('_', ' ')} • ID: {request.requestNumber}
                                            {!isStudent && request.requester && (
                                                <> • By: {request.requester.firstName} {request.requester.lastName} ({request.requester.role})</>
                                            )}
                                        </p>
                                        <p className="text-sm mt-2">
                                            {request.description}
                                        </p>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex flex-col items-end gap-2">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                        {!isStudent && (
                                            <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
                                                View
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                        <DialogDescription>
                            Review the details of the service request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold text-muted-foreground">Request Number</p>
                                    <p>{selectedRequest.requestNumber}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Status</p>
                                    <Badge variant={getStatusBadgeVariant(selectedRequest.status) as any}>{selectedRequest.status}</Badge>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Type</p>
                                    <p>{selectedRequest.type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Submitted On</p>
                                    <p>{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                                </div>
                                {selectedRequest.requester && (
                                    <div className="col-span-2">
                                        <p className="font-semibold text-muted-foreground">Requested By</p>
                                        <p>{selectedRequest.requester.firstName} {selectedRequest.requester.lastName} ({selectedRequest.requester.role}) - {selectedRequest.requester.email}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-muted-foreground text-sm">Subject</p>
                                <p className="text-sm">{selectedRequest.subject}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-muted-foreground text-sm">Description</p>
                                <div className="text-sm min-h-[80px] p-3 bg-muted rounded-md mt-1 whitespace-pre-wrap">
                                    {selectedRequest.description}
                                </div>
                            </div>

                            {!isStudent && selectedRequest.status === 'PENDING' && (
                                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleUpdateStatus('REJECTED')}
                                        disabled={updating}
                                    >
                                        {updating ? 'Processing...' : 'Reject Request'}
                                    </Button>
                                    <Button
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleUpdateStatus('APPROVED')}
                                        disabled={updating}
                                    >
                                        {updating ? 'Processing...' : 'Approve Request'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
