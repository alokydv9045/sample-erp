'use client';

import { useState, useEffect } from 'react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VehicleModal } from './VehicleModal';

export default function VehiclesTable() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await transportAPI.getVehicles();
      setVehicles(res.vehicles || []);
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to mark this vehicle as out of service?')) return;
    try {
      await transportAPI.deleteVehicle(id);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Vehicles ({vehicles.length})</h3>
        <Button size="sm" onClick={() => { setSelectedVehicle(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Registration No.</TableHead>
              <TableHead>Model/Make</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No vehicles found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.registrationNo}</TableCell>
                  <TableCell>{v.make} {v.model}</TableCell>
                  <TableCell>{v.capacity} seats</TableCell>
                  <TableCell>
                    {v.primaryDriver ? `${v.primaryDriver.user.firstName} ${v.primaryDriver.user.lastName}` : <span className="text-muted-foreground italic">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.status === 'ACTIVE' ? 'default' : v.status === 'MAINTENANCE' ? 'destructive' : 'secondary'} className={v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedVehicle(v); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteVehicle(v.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VehicleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchVehicles}
        vehicle={selectedVehicle}
      />
    </div>
  );
}
