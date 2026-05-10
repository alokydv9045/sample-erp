'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bus, 
  ArrowLeft, 
  ShieldCheck, 
  Wrench, 
  FileText, 
  Loader2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AddVehiclePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    make: '',
    model: '',
    capacity: '',
    status: 'ACTIVE',
    insuranceExpiry: '',
    permitExpiry: '',
    fitnessExpiry: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await transportAPI.createVehicle({
        ...formData,
        capacity: parseInt(formData.capacity)
      });
      if (res.data?.success) {
        toast.success('Vehicle registered successfully!');
        router.push('/dashboard/transport/vehicles');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="rounded-2xl hover:bg-slate-100 font-black h-12 px-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </Button>
        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black h-10 px-6 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            REGISTRATION HUB
        </Badge>
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">New Transport Asset</h1>
        <p className="text-slate-500 font-medium mt-1">Onboard a vehicle and set compliance monitoring dates.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-4 md:p-8">
            <CardHeader className="pb-8 border-b border-slate-100 mb-8">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <Bus className="h-6 w-6 text-slate-900" />
                    Asset Details
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium tracking-tight">Primary registration and capacity information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Internal Name</Label>
                    <Input 
                        placeholder="e.g., North Campus Bus - 01" 
                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Registration #</Label>
                    <Input 
                        placeholder="e.g., TS 09 EQ 1234" 
                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900 font-mono"
                        required 
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Manufacturer & Model</Label>
                    <div className="flex gap-3">
                        <Input 
                            placeholder="Make" 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
                            required 
                            value={formData.make}
                            onChange={(e) => setFormData({...formData, make: e.target.value})}
                        />
                        <Input 
                            placeholder="Model" 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
                            required 
                            value={formData.model}
                            onChange={(e) => setFormData({...formData, model: e.target.value})}
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Seating Capacity</Label>
                    <Input 
                        type="number"
                        placeholder="e.g., 42" 
                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
                        required 
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-4 md:p-8">
            <CardHeader className="pb-8 border-b border-slate-100 mb-8">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    Compliance & Document Lifecycle
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium tracking-tight">Set expiry dates for automated dashboard alerts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-3">
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Insurance Expiry</Label>
                    <div className="relative">
                        <Input 
                            type="date"
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900 pl-11"
                            value={formData.insuranceExpiry}
                            onChange={(e) => setFormData({...formData, insuranceExpiry: e.target.value})}
                        />
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Permit Expiry</Label>
                    <div className="relative">
                        <Input 
                            type="date"
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900 pl-11"
                            value={formData.permitExpiry}
                            onChange={(e) => setFormData({...formData, permitExpiry: e.target.value})}
                        />
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Fitness/FC Expiry</Label>
                    <div className="relative">
                        <Input 
                            type="date"
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-slate-900 pl-11"
                            value={formData.fitnessExpiry}
                            onChange={(e) => setFormData({...formData, fitnessExpiry: e.target.value})}
                        />
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-5">
            <Button variant="ghost" className="h-16 px-10 rounded-2xl font-black text-slate-400 hover:text-slate-900" type="button" onClick={() => router.back()}>Cancel Registration</Button>
            <Button className="h-16 px-14 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-2xl shadow-slate-950/30 font-black text-white transition-all flex items-center gap-3" disabled={isLoading} type="submit">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bus className="h-5 w-5" />}
                COMPLETE ONBOARDING
            </Button>
        </div>
      </form>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className: string }) {
    return <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${className}`}>{children}</div>
}
