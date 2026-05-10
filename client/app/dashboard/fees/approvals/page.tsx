'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { feeAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, X } from 'lucide-react';

export default function FeeApprovalsPage() {
    const [adjustments, setAdjustments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { canManageFees } = usePermissions();

    useEffect(() => {
        fetchAdjustments();
    }, []);

    const fetchAdjustments = async () => {
        setIsLoading(true);
        try {
            const data = await feeAPI.getAdjustments();
            setAdjustments(data.adjustments || []);
        } catch (err) {
            console.error('Failed to fetch adjustments', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string, isApproved: boolean) => {
        try {
            await feeAPI.approveAdjustment(id, { status: isApproved ? 'APPROVED' : 'REJECTED' });
            fetchAdjustments();
        } catch (err) {
            console.error('Failed to update adjustment status', err);
        }
    };

    const pendingAdjustments = adjustments.filter(a => a.status === 'PENDING');
    const pastAdjustments = adjustments.filter(a => a.status !== 'PENDING');

    const renderTable = (data: any[], isPending: boolean) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {isPending && canManageFees && <TableHead>Action</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                            No adjustments found
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((adj) => (
                        <TableRow key={adj.id}>
                            <TableCell className="font-medium">
                                <Badge variant="outline">{adj.type}</Badge>
                            </TableCell>
                            <TableCell>{adj.student?.user?.firstName} {adj.student?.user?.lastName}</TableCell>
                            <TableCell>{adj.student?.currentClass?.name}</TableCell>
                            <TableCell>₹{adj.amount?.toLocaleString()}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={adj.reason}>{adj.reason || '-'}</TableCell>
                            <TableCell>{new Date(adj.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Badge className={
                                    adj.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        adj.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-orange-100 text-orange-700'
                                }>
                                    {adj.status}
                                </Badge>
                            </TableCell>
                            {isPending && canManageFees && (
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(adj.id, true)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleApprove(adj.id, false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Fee Approvals</h1>
                <p className="text-muted-foreground">Manage discounts, scholarships, and refunds</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Adjustment Requests</CardTitle>
                    <CardDescription>Review and approve financial adjustments</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <Tabs defaultValue="pending">
                            <TabsList>
                                <TabsTrigger value="pending">
                                    Pending ({pendingAdjustments.length})
                                </TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="pending" className="mt-4">
                                {renderTable(pendingAdjustments, true)}
                            </TabsContent>
                            <TabsContent value="history" className="mt-4">
                                {renderTable(pastAdjustments, false)}
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
