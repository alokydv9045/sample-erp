'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Bus, 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertTriangle,
  Activity,
  User,
  ShieldCheck
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function EditVehiclePage() {
  const router = useRouter();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    capacity: '',
    fuelType: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setIsLoading(true);
        const res = await transportAPI.getVehicleById(id as string);
        if (res.data?.success) {
            const v = res.data.vehicle;
            setFormData({
                name: v.name || '',
                registrationNumber: v.registrationNumber || '',
                make: v.make || '',
                model: v.model || '',
                year: v.year?.toString() || '',
                capacity: v.capacity?.toString() || '',
                fuelType: v.fuelType || '',
                status: v.status || 'ACTIVE'
            });
        }
      } catch (err: any) {
        toast.error('Failed to load asset data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await transportAPI.updateVehicle(id as string, {
          ...formData,
          year: parseInt(formData.year),
          capacity: parseInt(formData.capacity)
      });
      
      if (res.data?.success) {
        toast.success('Fleet record updated successfully.');
        router.push(`/dashboard/transport/vehicles/${id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">Accessing Asset File...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button 
            variant="ghost" 
            className="rounded-2xl hover:bg-slate-100 font-black h-12 px-6" 
            onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Cancel
        </Button>
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center shadow-inner">
                 <Bus className="h-5 w-5" />
             </div>
             <div>
                 <h1 className="text-xl font-black text-slate-900 leading-none">Edit Vehicle</h1>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Asset Reference: {id?.toString().slice(0,8)}</p>
             </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100">
          <CardHeader className="p-0 border-b border-slate-100 pb-8 mb-8">
              <CardTitle className="text-2xl font-black text-slate-900">Registry Details</CardTitle>
              <CardDescription className="font-medium text-slate-400 tracking-tight">Update core identification and operational status.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Asset Name</label>
                <div className="relative">
                    <Input 
                        required 
                        placeholder="e.g. Bus 01 - North Link" 
                        className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold pl-12"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <Bus className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Registration No.</label>
                <div className="relative">
                    <Input 
                        required 
                        placeholder="TS 08 EX 1234" 
                        className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold pl-12 uppercase"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({...formData, registrationNumber: e.target.value.toUpperCase()})}
                    />
                    <ShieldCheck className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Make / Brand</label>
                <Input 
                    required 
                    placeholder="e.g. Tata Motors" 
                    className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Model Name</label>
                <Input 
                    required 
                    placeholder="e.g. Starbus" 
                    className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Year</label>
                <Input 
                    type="number"
                    required 
                    placeholder="2024" 
                    className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Global Capacity</label>
                <div className="relative">
                    <Input 
                        type="number"
                        required 
                        placeholder="40" 
                        className="h-14 rounded-2xl border-2 focus-visible:ring-slate-900 font-bold pl-12"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    />
                    <User className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Fuel Protocol</label>
                <Select 
                    value={formData.fuelType} 
                    onValueChange={(val) => setFormData({...formData, fuelType: val})}
                >
                    <SelectTrigger className="h-14 rounded-2xl border-2 focus:ring-slate-900 font-bold">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 shadow-2xl">
                        <SelectItem value="DIESEL" className="font-bold py-3">Diesel</SelectItem>
                        <SelectItem value="PETROL" className="font-bold py-3">Petrol</SelectItem>
                        <SelectItem value="CNG" className="font-bold py-3">CNG</SelectItem>
                        <SelectItem value="ELECTRIC" className="font-bold py-3">Electric</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Operational Status</label>
                <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({...formData, status: val})}
                >
                    <SelectTrigger className={`h-14 rounded-2xl border-2 font-black ${
                        formData.status === 'ACTIVE' ? 'border-emerald-100 text-emerald-600 bg-emerald-50/30' : 'border-amber-100 text-amber-600 bg-amber-50/30'
                    }`}>
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 shadow-2xl">
                        <SelectItem value="ACTIVE" className="font-black py-4 text-emerald-600">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                ACTIVE
                            </div>
                        </SelectItem>
                        <SelectItem value="MAINTENANCE" className="font-black py-4 text-amber-600">
                             <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                MAINTENANCE
                            </div>
                        </SelectItem>
                        <SelectItem value="INACTIVE" className="font-black py-4 text-slate-400">INACTIVE</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto h-16 px-12 bg-slate-900 text-white rounded-[2rem] font-black text-lg active:scale-95 transition-all shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] hover:shadow-none"
            >
                {isSubmitting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                        <Save className="mr-3 h-5 w-5" />
                        COMMIT CHANGES
                    </>
                )}
            </Button>
        </div>
      </form>
    </div>
  );
}
