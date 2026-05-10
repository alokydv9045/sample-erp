'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bus, 
  MapPin, 
  Navigation, 
  Play, 
  Square, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Phone,
  Settings,
  ArrowLeft,
  Smartphone,
  Zap,
  Users,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { transportAPI } from '@/lib/api/transport';
import { toast } from 'sonner';

export default function DriverDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    fuelChecked: false,
    tireChecked: false,
    lightsChecked: false,
    firstAidChecked: false,
    cameraChecked: false,
  });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    fetchAssignment();
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const fetchAssignment = async () => {
    try {
      setIsLoading(true);
      const res = await transportAPI.getDriverAssignment();
      if (res.data?.success) {
        setAssignment(res.data);
        if (res.data.activeTrip) {
            setActiveTripId(res.data.activeTrip.id);
            resumeTracking(res.data.activeTrip.id);
        }
      }
    } catch (err: any) {
      toast.error('Protocol Sync Failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const startTrip = async () => {
    const allChecked = Object.values(checklist).every(v => v);
    if (!allChecked) {
      toast.error('Complete pre-route safety audit first.');
      return;
    }

    try {
      const res = await transportAPI.startTrip({
        vehicleId: assignment.vehicle.id,
        routeId: assignment.route.id,
        type: 'PICKUP'
      });

      if (res.data?.success) {
        setActiveTripId(res.data.trip.id);
        startTracking(res.data.trip.id);
        toast.success('Route operational. GPS streaming active.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start trip.');
    }
  };

  const endTrip = async () => {
    if (!activeTripId) return;

    try {
      const res = await transportAPI.stopTrip(activeTripId);
      if (res.data?.success) {
        setActiveTripId(null);
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        toast.info('Shift completed successfully.');
      }
    } catch (err: any) {
      toast.error('Failed to terminate trip protocol.');
    }
  };

  const startTracking = (tripId: string) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by this device.');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        transportAPI.updateLocation({
          tripId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0
        }).catch(err => console.error('Telemetry stream error', err));
      },
      (error) => {
        console.error('GPS Error:', error);
        toast.error('GPS Signal Interrupted.');
      },
      { enableHighAccuracy: true }
    );
  };

  const resumeTracking = (tripId: string) => {
    if (!watchIdRef.current) startTracking(tripId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Syncing Driver Identity...</p>
      </div>
    );
  }

  const { vehicle, route } = assignment || {};

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <Button variant="ghost" className="rounded-xl hover:bg-slate-100 font-bold h-10 px-4 w-fit" onClick={() => router.push('/dashboard/transport')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <div className="flex items-center gap-4 py-4">
            <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Bus className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Driver Terminal</h1>
                <p className="text-sm text-muted-foreground font-medium">Assignment: <span className="text-slate-900 font-bold">{vehicle?.name || 'Loading...'}</span></p>
            </div>
          </div>
        </div>
        <Badge className={`h-12 px-8 rounded-2xl font-black flex items-center gap-2 border-none shadow-xl ${
            activeTripId ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
        }`}>
            {activeTripId ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            {activeTripId ? 'LIVE DEPLOYMENT' : 'STANDBY MODE'}
        </Badge>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-10">
            <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100">
                <CardHeader className="p-0 border-b border-slate-100 pb-8 mb-8">
                    <CardTitle className="text-2xl font-black text-slate-900">Safety Audit Protocol</CardTitle>
                    <CardDescription className="font-medium text-slate-400">Complete all checks to authorize deployment.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    {Object.entries(checklist).map(([key, value]) => (
                        <div 
                            key={key} 
                            onClick={() => !activeTripId && setChecklist(prev => ({...prev, [key]: !value}))}
                            className={`p-6 rounded-3xl border flex items-center justify-between cursor-pointer transition-all ${
                                value ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${value ? 'bg-emerald-500 border-none text-white' : 'border-slate-300'}`}>
                                    {value && <CheckCircle2 className="h-5 w-5" />}
                                </span>
                                <p className="font-black text-xs uppercase tracking-widest">{key.replace('Checked', '').replace(/([A-Z])/g, ' $1')}</p>
                            </div>
                            <ShieldCheck className={`h-6 w-6 ${value ? 'opacity-100' : 'opacity-10'}`} />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-10">
            <Card className={`border-none shadow-2xl rounded-[3rem] p-4 text-center transition-all ${
                activeTripId ? 'bg-rose-50 ring-2 ring-rose-200' : 'bg-slate-950 text-white'
            }`}>
                 <div className="p-10 space-y-8">
                    <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                         {activeTripId ? (
                             <Navigation className="h-10 w-10 text-rose-500 animate-bounce" />
                         ) : (
                             <Play className="h-10 w-10 text-white" />
                         )}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tighter">{activeTripId ? 'Route Active' : 'Start Journey'}</h2>
                        <p className={`font-medium mt-2 ${activeTripId ? 'text-rose-700' : 'text-slate-400'}`}>
                            {activeTripId ? 'GPS streaming is live to all parents.' : 'Initialize route tracking system.'}
                        </p>
                    </div>
                    {!activeTripId ? (
                        <Button 
                            onClick={startTrip} 
                            disabled={!assignment?.vehicle || !assignment?.route}
                            className="w-full h-18 bg-white text-slate-950 rounded-[2rem] font-black text-xl hover:bg-slate-100 shadow-2xl active:scale-95 transition-all py-8"
                        >
                            START SHIFT
                        </Button>
                    ) : (
                        <Button 
                            onClick={endTrip} 
                            variant="destructive"
                            className="w-full h-18 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all py-8"
                        >
                            <Square className="mr-3 h-6 w-6 fill-current" />
                            STOP JOURNEY
                        </Button>
                    )}
                 </div>
            </Card>

            <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Assigned Intel</p>
                <div className="space-y-6">
                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem]">
                        <Clock className="h-7 w-7 text-blue-500" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Route</p>
                            <p className="font-black text-lg text-slate-900 leading-none mt-1">{route?.name || 'Not Designated'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem]">
                        <MapPin className="h-7 w-7 text-purple-500" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Stop</p>
                            <p className="font-black text-lg text-slate-900 leading-none mt-1">
                                {route?.stops?.[0]?.name || 'Loading...'}
                            </p>
                        </div>
                    </div>
                </div>
                {!assignment?.route && (
                    <div className="mt-6 flex items-center gap-2 p-4 bg-rose-50 rounded-2xl text-rose-800 border border-rose-100">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-tight">Deployment Locked: No Route Assigned</p>
                    </div>
                )}
            </Card>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] p-8 flex items-center justify-between group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000 group-hover:scale-[2]">
                <Smartphone className="w-32 h-32" />
           </div>
           <div className="flex items-center gap-8 relative z-10">
                <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl">
                    <Phone className="h-10 w-10 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-black tracking-tight">Need Dispatch Support?</h3>
                    <p className="text-slate-400 font-medium">Contact the central transport hub for emergencies.</p>
                </div>
           </div>
           <Button className="relative z-10 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl h-14 px-10 font-black shadow-2xl shadow-slate-950/50">
               DIAL DISPATCH
           </Button>
      </Card>
    </div>
  );
}
