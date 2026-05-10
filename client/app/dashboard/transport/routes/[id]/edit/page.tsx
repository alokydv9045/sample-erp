'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Navigation, 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Trash2, 
  Loader2,
  Clock,
  Map as MapIcon,
  CheckCircle2,
  Save
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditRoutePage() {
  const router = useRouter();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startLocation: '',
    endLocation: '',
    stops: [{ id: undefined, name: '', arrivalTime: '', order: 1, latitude: 0.0, longitude: 0.0 }]
  });

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setIsLoading(true);
        const res = await transportAPI.getRouteById(id as string);
        if (res.data?.success) {
            const route = res.data.route;
            setFormData({
                name: route.name || '',
                description: route.description || '',
                startLocation: route.startLocation || '',
                endLocation: route.endLocation || '',
                stops: route.stops?.map((s: any) => ({
                    id: s.id,
                    name: s.name || '',
                    arrivalTime: s.arrivalTime || '',
                    order: s.order || 1,
                    latitude: s.latitude || 0.0,
                    longitude: s.longitude || 0.0
                })) || []
            });
        }
      } catch (err: any) {
        toast.error('Failed to load route network details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoute();
  }, [id]);

  const addStop = () => {
    setFormData({
      ...formData,
      stops: [...formData.stops, { 
        id: undefined,
        name: '', 
        arrivalTime: '', 
        order: formData.stops.length + 1,
        latitude: 0.0,
        longitude: 0.0
      }]
    });
  };

  const removeStop = (index: number) => {
    const newStops = formData.stops.filter((_, i) => i !== index);
    const reorderedStops = newStops.map((stop, i) => ({ ...stop, order: i + 1 }));
    setFormData({ ...formData, stops: reorderedStops });
  };

  const updateStop = (index: number, field: string, value: any) => {
    const newStops = [...formData.stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setFormData({ ...formData, stops: newStops });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        stops: formData.stops.map(s => ({
            ...s,
            latitude: Number(s.latitude) || 0.0,
            longitude: Number(s.longitude) || 0.0
        }))
      };
      
      const res = await transportAPI.updateRoute(id as string, payload);
      if (res.data?.success) {
        toast.success('Route network updated successfully!');
        router.push('/dashboard/transport/routes');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update route.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Recalibrating Network Trace...</p>
        </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="rounded-2xl hover:bg-slate-100 font-black h-12 px-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </Button>
        <div className="bg-amber-50 text-amber-600 px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            Recalibration Mode
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Modify Route Trace</h1>
        <p className="text-slate-500 font-medium mt-1">Adjust stops, timings and designation for: <span className="text-slate-900 font-bold">{formData.name}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5">
                <Navigation className="w-32 h-32" />
            </div>
            <CardHeader className="pb-8 border-b border-slate-100 mb-8 p-0">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <Navigation className="h-6 w-6 text-blue-600" />
                    Network Parameters
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium tracking-tight">Modify core route properties.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-10 md:grid-cols-2 p-0">
                <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Route Designation</Label>
                    <Input 
                        placeholder="e.g., North Express - Line A" 
                        className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 text-lg font-bold"
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Start Point</Label>
                        <Input 
                            placeholder="Origin" 
                            className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                            required 
                            value={formData.startLocation}
                            onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
                        />
                    </div>
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Final Stop</Label>
                        <Input 
                            placeholder="Destination" 
                            className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                            required 
                            value={formData.endLocation}
                            onChange={(e) => setFormData({...formData, endLocation: e.target.value})}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 ring-1 ring-slate-100">
             <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Waypoint Syncing</h3>
                    <p className="text-slate-400 font-medium">Verify stop stability and arrival precision.</p>
                </div>
                <Button type="button" onClick={addStop} className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 font-bold transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Waypoint
                </Button>
             </div>

             <div className="space-y-6 relative ml-6 pl-10 border-l-2 border-dashed border-slate-200">
                {formData.stops.map((stop, index) => (
                    <div key={index} className="relative group">
                         <div className="absolute -left-[3.25rem] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center font-black text-[10px] text-blue-600 shadow-lg">
                            {index + 1}
                         </div>
                         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center gap-6 group-hover:border-blue-200 transition-all">
                            <div className="flex-1 w-full space-y-3">
                                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Waypoint Name</Label>
                                <Input 
                                    placeholder="e.g., Central Park Corner" 
                                    className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-500 font-bold"
                                    required 
                                    value={stop.name}
                                    onChange={(e) => updateStop(index, 'name', e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-48 space-y-3">
                                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Scheduled Time</Label>
                                <div className="relative">
                                    <Input 
                                        type="time" 
                                        className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-500 pl-11"
                                        required 
                                        value={stop.arrivalTime}
                                        onChange={(e) => updateStop(index, 'arrivalTime', e.target.value)}
                                    />
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                            {formData.stops.length > 1 && (
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-14 w-14 rounded-2xl hover:bg-rose-50 hover:text-rose-500 text-slate-300"
                                    onClick={() => removeStop(index)}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                         </div>
                    </div>
                ))}
             </div>
        </Card>

        <div className="flex justify-end gap-5">
            <Button variant="ghost" className="h-16 px-10 rounded-2xl font-black text-slate-400 hover:text-slate-900" type="button" onClick={() => router.back()}>Cancel Edit</Button>
            <Button className="h-16 px-14 rounded-2xl bg-slate-900 hover:bg-black shadow-2xl shadow-slate-900/30 font-black text-white transition-all flex items-center gap-3" disabled={isSaving} type="submit">
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                UPDATE NETWORK TRACE
            </Button>
        </div>
      </form>
    </div>
  );
}
