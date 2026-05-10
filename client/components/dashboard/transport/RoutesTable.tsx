'use client';

import { useState, useEffect } from 'react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function RoutesTable() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await transportAPI.getRoutes();
      setRoutes(res.routes || []);
    } catch (error) {
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Routes ({routes.length})</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Route
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Route Name</TableHead>
              <TableHead>Start Point</TableHead>
              <TableHead>End Point</TableHead>
              <TableHead>Total Stops</TableHead>
              <TableHead>Assigned Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No routes found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              routes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorCode || '#FFD700' }} />
                      {r.name}
                    </div>
                  </TableCell>
                  <TableCell>{r.startLocation || 'N/A'}</TableCell>
                  <TableCell>{r.endLocation || 'N/A'}</TableCell>
                  <TableCell>{r.stops?.length || 0}</TableCell>
                  <TableCell>{r._count?.allocations || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                      <Edit className="h-4 w-4" />
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
