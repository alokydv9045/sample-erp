'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Bus, 
  ArrowLeft, 
  Wrench, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Users, 
  Loader2,
  Calendar,
  AlertTriangle,
  History,
  Activity,
  User,
  Plus,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehicleDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [logForm, setLogForm] = useState({
      serviceType: '',
      odometerReading: '',
      cost: '',
      vendorName: '',
      description: '',
      serviceDate: new Date().toISOString().split('T')[0]
  });

  const fetchVehicle = async () => {
    try {
      setIsLoading(true);
      const res = await transportAPI.getVehicleById(id as string);
      if (res.data?.success) setVehicle(res.data.vehicle);
    } catch (err: any) {
      toast.error('Could not fetch asset details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const handleLogSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          setIsSubmitting(true);
          const res = await transportAPI.logMaintenance(id as string, logForm);
          if (res.data?.success) {
              toast.success('Maintenance protocol logged.');
              setIsLogModalOpen(false);
              fetchVehicle(); // Refresh data
          }
      } catch (err: any) {
          toast.error('Failed to log service record.');
      } finally {
          setIsSubmitting(false);
      }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Accessing Secure Records...</p>
      </div>
    );
  }

  if (!vehicle) {
      return (
          <div className="p-20 text-center space-y-6">
              <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto" />
              <h2 className="text-2xl font-black">Asset Not Found</h2>
              <Button onClick={() => router.back()}>Return to Fleet</Button>
          </div>
      )
  }

  const enrollmentPercentage = Math.min(100, Math.round((vehicle.enrolledCount / vehicle.capacity) * 100));

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="rounded-2xl hover:bg-slate-100 font-black h-12 px-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </Button>
        <div className="flex gap-2">
            <Badge className={`border-none h-10 px-6 rounded-2xl font-black flex items-center gap-2 ${
                vehicle.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
                <Activity className="h-4 w-4" />
                {vehicle.status}
            </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-10">
        <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl">
                <Bus className="h-12 w-12" />
            </div>
            <div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">{vehicle.name}</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 mt-1">
                    {vehicle.registrationNumber} • {vehicle.make} {vehicle.model}
                </p>
                <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="font-mono bg-slate-50 text-slate-500 border-slate-200">
                        {vehicle.odometerReading.toLocaleString()} KM
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-tighter font-black text-[10px]">
                        {vehicle.fuelType}
                    </Badge>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 font-black border-slate-200" onClick={() => setIsLogModalOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Log Service
             </Button>
             <Button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black shadow-2xl shadow-slate-900/30">
                Edit Record
             </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
            <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100">
                <CardHeader className="p-0 border-b border-slate-100 pb-8 mb-8">
                    <CardTitle className="text-2xl font-black text-slate-900">Compliance Audit</CardTitle>
                    <CardDescription className="font-medium text-slate-400">Automated document lifecycle tracking.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 grid gap-6 md:grid-cols-2">
                    {vehicle.documentStatus.map((doc: any) => (
                        <div key={doc.label} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:bg-white transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${
                                    doc.status === 'EXPIRED' ? 'text-rose-500' : doc.status === 'CRITICAL' ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                    {doc.status === 'OK' ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{doc.label}</p>
                            </div>
                            <div className="flex items-end justify-between">
                                <p className="text-xl font-black text-slate-900">{doc.expiry ? format(new Date(doc.expiry), 'MMM dd, yyyy') : 'N/A'}</p>
                                <Badge className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm border-none ${
                                    doc.status === 'EXPIRED' ? 'bg-rose-500 text-white' : doc.status === 'CRITICAL' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                }`}>
                                    {doc.daysRemaining > 0 ? `${doc.daysRemaining} Days Left` : 'EXPIRED'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100">
                <CardHeader className="p-0 border-b border-slate-100 pb-8 mb-8">
                    <CardTitle className="text-2xl font-black text-slate-900">Maintenance History</CardTitle>
                    <CardDescription className="font-medium text-slate-400">Recent service and repair logs.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    {vehicle.maintenanceLogs?.length > 0 ? (
                        vehicle.maintenanceLogs.map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400">
                                        <Wrench className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">{log.serviceType}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {format(new Date(log.serviceDate), 'MMM dd, yyyy')} • {log.vendorName}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg text-slate-900">₹{log.cost.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">RECORDED</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-30">
                            <History className="h-12 w-12 mx-auto mb-4" />
                            <p className="font-bold text-sm">No service logs on record.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-10">
             <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <User className="h-32 w-32" />
                </div>
                <h3 className="text-xl font-black mb-8 relative z-10">Commanding Officer</h3>
                <div className="relative z-10 flex items-center gap-6 mb-8">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black">
                        {vehicle.primaryDriver?.user?.firstName?.[0] || 'D'}
                     </div>
                     <div>
                        <p className="text-2xl font-black leading-tight">{vehicle.primaryDriver?.user?.firstName || 'Unassigned'} {vehicle.primaryDriver?.user?.lastName || ''}</p>
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-1">Primary Pilot</p>
                     </div>
                </div>
                <div className="space-y-4 relative z-10">
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl text-sm font-medium border border-white/10">
                        <span className="opacity-50 font-black text-[10px] uppercase">Contact</span>
                        <span className="font-bold">{vehicle.primaryDriver?.user?.phone || 'Not Available'}</span>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl text-sm font-medium border border-white/10">
                        <span className="opacity-50 font-black text-[10px] uppercase">Incident Count</span>
                        <span className="font-black text-emerald-400">Zero</span>
                     </div>
                </div>
             </Card>

             <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100 flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center transition-transform hover:scale-110 duration-500">
                    <Users className="h-8 w-8" />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-tight">Manifest Enrollment</h4>
                    <p className="text-slate-400 font-medium text-sm mt-1">Current occupancy of global capacity.</p>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${enrollmentPercentage}%` }} 
                    />
                </div>
                <div className="flex items-center gap-4 text-3xl font-black text-slate-900">
                    <span>{vehicle.enrolledCount}</span>
                    <span className="text-slate-200">/</span>
                    <span className="text-slate-400">{vehicle.capacity}</span>
                </div>
             </Card>
        </div>
      </div>

      {/* Log Maintenance Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-xl">
              <form onSubmit={handleLogSubmit}>
                  <div className="bg-slate-900 p-8 text-white">
                      <DialogHeader>
                          <DialogTitle className="text-3xl font-black tracking-tighter">Log System Service</DialogTitle>
                          <DialogDescription className="text-slate-400 font-medium pt-2">Record mechanical maintenance and update odometer.</DialogDescription>
                      </DialogHeader>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Service Type</label>
                              <Input 
                                  required 
                                  placeholder="e.g. Engine Oil, Brakes" 
                                  className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                                  value={logForm.serviceType}
                                  onChange={(e) => setLogForm({...logForm, serviceType: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Service Date</label>
                              <Input 
                                  type="date" 
                                  required 
                                  className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                                  value={logForm.serviceDate}
                                  onChange={(e) => setLogForm({...logForm, serviceDate: e.target.value})}
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Odometer (KM)</label>
                              <Input 
                                  type="number" 
                                  required 
                                  placeholder={vehicle.odometerReading.toString()} 
                                  className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                                  value={logForm.odometerReading}
                                  onChange={(e) => setLogForm({...logForm, odometerReading: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Total Cost (₹)</label>
                              <Input 
                                  type="number" 
                                  required 
                                  placeholder="0.00" 
                                  className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                                  value={logForm.cost}
                                  onChange={(e) => setLogForm({...logForm, cost: e.target.value})}
                              />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vendor/Workshop</label>
                          <Input 
                              required 
                              placeholder="Authorized Service Center" 
                              className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                              value={logForm.vendorName}
                              onChange={(e) => setLogForm({...logForm, vendorName: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Maintenance Scope</label>
                          <Textarea 
                              placeholder="Detailed notes on parts replaced or issues fixed..." 
                              className="rounded-2xl border-2 focus-visible:ring-slate-900 font-medium min-h-[100px]"
                              value={logForm.description}
                              onChange={(e) => setLogForm({...logForm, description: e.target.value})}
                          />
                      </div>
                  </div>
                  <DialogFooter className="p-8 pt-0">
                      <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg active:scale-95 transition-all shadow-2xl shadow-slate-900/30"
                      >
                          {isSubmitting ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                              'SUBMIT PROTOCOL'
                          )}
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
