'use client';

import { useState, useEffect } from 'react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AllocationsTable() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const res = await transportAPI.getAllocations();
      setAllocations(res.allocations || []);
    } catch (error) {
      toast.error('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  const removeAllocation = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this transport assignment?')) return;
    try {
      await transportAPI.removeAssignment(studentId);
      toast.success('Assignment removed successfully');
      fetchAllocations();
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Student Allocations ({allocations.length})</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" /> Assign Student
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Admission No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Assigned Route</TableHead>
              <TableHead>Pickup/Drop Stop</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No students assigned to transport yet.
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.student?.admissionNumber}</TableCell>
                  <TableCell className="font-medium">
                    {a.student?.user?.firstName} {a.student?.user?.lastName}
                  </TableCell>
                  <TableCell>{a.route?.name}</TableCell>
                  <TableCell>
                    {a.stop?.name}
                    <div className="text-xs text-muted-foreground">Est: {a.stop?.arrivalTime}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {a.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeAllocation(a.studentId)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
