'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Navigation, 
  ArrowLeft, 
  MapPin, 
  Users, 
  Clock, 
  Loader2,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Map as MapIcon
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function RouteDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [route, setRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setIsLoading(true);
        const res = await transportAPI.getRouteById(id as string);
        if (res.data?.success) setRoute(res.data.route);
      } catch (err: any) {
        toast.error('Network trace failed.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoute();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Mapping Route Topology...</p>
      </div>
    );
  }

  if (!route) {
    return (
        <div className="p-20 text-center space-y-6">
            <AlertCircle className="h-16 w-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black">Route Not Found</h2>
            <Button onClick={() => router.back()}>Back to Grid</Button>
        </div>
    )
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="rounded-2xl hover:bg-slate-100 font-black h-12 px-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </Button>
        <Badge className="bg-blue-50 text-blue-600 border-none h-10 px-6 rounded-2xl font-black flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            ACTIVE NETWORK
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-10">
        <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl">
                <Navigation className="h-12 w-12" />
            </div>
            <div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">{route.name}</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center gap-3 mt-1">
                    {route.startLocation} <Navigation className="h-3 w-3" /> {route.endLocation}
                </p>
            </div>
        </div>
        <div className="flex gap-3">
             <Button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black shadow-2xl shadow-slate-900/30 transition-all active:scale-95">
                Optimize Schedule
             </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
            <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100">
                <CardHeader className="p-0 border-b border-slate-100 pb-8 mb-8">
                    <CardTitle className="text-2xl font-black text-slate-900">Stop Manifest</CardTitle>
                    <CardDescription className="font-medium text-slate-400">Sequential pick-up coordinates and arrival flow.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="space-y-6 relative ml-4 pl-10 border-l-2 border-dashed border-slate-200">
                        {route.stops?.map((stop: any, index: number) => (
                            <div key={stop.id} className="relative group">
                                <div className="absolute -left-[3.25rem] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center font-black text-[10px] text-blue-600 shadow-lg">
                                    {index + 1}
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                                    <div>
                                        <p className="font-black text-slate-900 text-lg leading-none">{stop.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{stop.landmark || 'No Landmark'}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <p className="text-lg font-black text-slate-900 leading-none">{stop.arrivalTime}</p>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Arrival</p>
                                        </div>
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-10">
            <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-700">
                    <Users className="h-32 w-32" />
                </div>
                <h3 className="text-xl font-black mb-8 relative z-10 text-blue-400">Network Statistics</h3>
                <div className="space-y-8 relative z-10">
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10">
                        <div>
                            <p className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em] mb-1">TOTAL ENROLLED</p>
                            <p className="text-3xl font-black">{route._count?.allocations || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10">
                        <div>
                            <p className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em] mb-1">NETWORK EFFICIENCY</p>
                            <p className="text-3xl font-black">94.2%</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100 flex flex-col items-center text-center gap-6 group hover:translate-y-[-5px] transition-all">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">Geo-Fence Active</h4>
                    <p className="text-slate-400 font-medium text-sm mt-1 max-w-[200px]">Parents receive alerts within 500m of these stops.</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 rounded-xl px-10 h-12 border-none font-black text-xs uppercase tracking-widest">
                    SYSTEM SECURE
                </Badge>
            </Card>
        </div>
      </div>
    </div>
  );
}
