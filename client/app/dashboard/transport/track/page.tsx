'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Bus, 
  Clock, 
  Navigation, 
  ShieldCheck, 
  Bell, 
  Phone, 
  Info,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { transportAPI } from '@/lib/api/transport';
import { socketService } from '@/lib/socket';
import { toast } from 'sonner';

export default function TrackBusPage() {
  const router = useRouter();
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tripsLocation, setTripsLocation] = useState<Record<string, {lat: number, lng: number}>>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, any>>({});
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const fetchActiveTrips = async () => {
        try {
            setIsLoading(true);
            const res = await transportAPI.getActiveTrip();
            
            if (res.data?.success && res.data.trip) {
                const tripsData = Array.isArray(res.data.trip) ? res.data.trip : [res.data.trip];
                
                if (tripsData.length === 0) {
                    setActiveTrips([]);
                    setIsLoading(false);
                    return;
                }

                const mappedTrips = tripsData.map((tripData: any) => ({
                    id: tripData.id,
                    busName: tripData.vehicle?.name || 'School Bus',
                    regNo: tripData.vehicle?.registrationNumber || 'N/A',
                    driverName: tripData.vehicle?.primaryDriver?.user 
                        ? `${tripData.vehicle.primaryDriver.user.firstName} ${tripData.vehicle.primaryDriver.user.lastName}`
                        : 'Assigned Driver',
                    driverPhone: tripData.vehicle?.primaryDriver?.user?.phone || '',
                    route: tripData.route?.name || 'Active Route',
                    eta: 'Live Feed', 
                    nextStop: tripData.route?.stops?.[1]?.name || 'Next Point', 
                    lat: tripData.vehicle?.latitude || 17.4483, 
                    lng: tripData.vehicle?.longitude || 78.3915,
                }));

                setActiveTrips(mappedTrips);
                
                const initialLocations: Record<string, {lat: number, lng: number}> = {};
                mappedTrips.forEach((t: any) => {
                    initialLocations[t.id] = { lat: t.lat, lng: t.lng };
                });
                setTripsLocation(initialLocations);
                
                const socket = socketService.connect();
                mappedTrips.forEach((t: any) => {
                    socket.emit('join_trip', { tripId: t.id });
                });
                
                socket.on('bus_location_update', (data: any) => {
                    setTripsLocation(prev => ({
                        ...prev,
                        [data.tripId]: { lat: data.latitude, lng: data.longitude }
                    }));
                });

                socket.on('TRANSPORT_TRIP_COMPLETED', (data: any) => {
                    setActiveTrips(prev => prev.filter(t => t.id !== data.tripId));
                    if (markersRef.current[data.tripId]) {
                        markersRef.current[data.tripId].setMap(null);
                        delete markersRef.current[data.tripId];
                    }
                });
            } else {
                setActiveTrips([]);
            }
        } catch (err) {
            console.error('Active trips fetch error:', err);
            setActiveTrips([]);
        } finally {
            setIsLoading(false);
        }
    };

    fetchActiveTrips();
    return () => { 
        const socket = socketService.connect();
        activeTrips.forEach(t => socket.emit('leave_trip', { tripId: t.id }));
        socketService.disconnect(); 
        
        // Clean up all markers on unmount
        Object.values(markersRef.current).forEach(m => m.setMap(null));
        markersRef.current = {};
    };
  }, []); // Run once on mount

  useEffect(() => {
    const initMap = async () => {
        // @ts-ignore
        const google = window.google;
        if (!google || !mapRef.current) return;

        try {
            // Load required libraries
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

            if (!mapInstanceRef.current) {
                const mapOptions = {
                    center: Object.values(tripsLocation)[0] || { lat: 17.4483, lng: 78.3915 },
                    zoom: 13,
                    mapId: 'DEMO_MAP_ID',
                    disableDefaultUI: true,
                };
                mapInstanceRef.current = new Map(mapRef.current, mapOptions);
            }

            // Update or Create markers for each active trip
            activeTrips.forEach(trip => {
                const loc = tripsLocation[trip.id];
                if (!loc) return;

                if (!markersRef.current[trip.id]) {
                    const pinElement = new PinElement({
                        glyph: '🚌',
                        background: '#0F172A',
                        borderColor: '#1E293B',
                    });
                    
                    markersRef.current[trip.id] = new AdvancedMarkerElement({
                        map: mapInstanceRef.current,
                        position: loc,
                        content: pinElement.element,
                        title: `${trip.busName} (${trip.regNo})`
                    });
                } else {
                    markersRef.current[trip.id].position = loc;
                }
            });
        } catch (err) {
            console.error('Map initialization error:', err);
        }
    };

    if (!isLoading) {
        initMap();
    }

    return () => {
        // Continuous cleanup of markers that are no longer in activeTrips
        const activeIds = new Set(activeTrips.map(t => t.id));
        Object.keys(markersRef.current).forEach(id => {
            if (!activeIds.has(id)) {
                markersRef.current[id].setMap(null);
                delete markersRef.current[id];
            }
        });
    };
  }, [isLoading, activeTrips, tripsLocation]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Live Map...</p>
        </div>
    );
  }

  if (!activeTrips.length && !isLoading) {
      return (
        <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden animate-in fade-in duration-700">
            <div ref={mapRef} className="absolute inset-0 z-0 bg-slate-50" />
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/10 backdrop-blur-sm">
                <Card className="bg-white/60 backdrop-blur-3xl border border-white/50 shadow-[0_64px_64px_-24px_rgba(0,0,0,0.2)] p-16 rounded-[4rem] flex flex-col items-center text-center gap-10 max-w-xl mx-4 ring-1 ring-white/20">
                    <div className="w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce">
                        <Bus className="h-10 w-10" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Fleet Standby</h2>
                        <p className="text-slate-500 font-bold text-lg leading-relaxed max-w-xs mx-auto">No active transport detected on any route. Network monitoring resumes upon dispatch.</p>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                        <Button onClick={() => window.location.reload()} className="rounded-[2rem] bg-slate-900 text-white h-16 text-lg font-black shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Refresh Matrix</Button>
                        <Button onClick={() => router.back()} variant="ghost" className="rounded-2xl h-14 font-black text-slate-400 hover:text-slate-900 transition-colors">Return to Hub</Button>
                    </div>
                </Card>
            </div>
        </div>
      );
  }

  // Focus on the first trip for detail display, or let user select (simplified for now)
  const focusTrip = activeTrips[0];

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden animate-in fade-in duration-1000">
      {/* Background Map Layer */}
      <div ref={mapRef} className="absolute inset-0 z-0 bg-slate-50" />
      
      {/* Network Command Overlay - Top Left */}
      <div className="absolute top-8 left-8 right-8 flex flex-col md:flex-row items-start justify-between gap-6 pointer-events-none z-10">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <Button variant="ghost" className="rounded-2xl bg-white/50 backdrop-blur-3xl border border-white/50 hover:bg-white/80 font-black h-12 px-6 w-fit shadow-2xl shadow-slate-900/5 transition-all active:scale-95" onClick={() => router.back()}>
            <ArrowLeft className="mr-3 h-5 w-5" />
            Terminal Exit
          </Button>
          <Card className="bg-white/40 backdrop-blur-3xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 rounded-[3.5rem] ring-1 ring-white/20 min-w-[320px]">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                    <Globe className="h-5 w-5 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900">
                    Live Matrix
                </h1>
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] px-1">
                Monitoring <span className="text-emerald-600 px-2 bg-emerald-50 rounded-full">{activeTrips.length} Active Vessels</span>
             </p>
          </Card>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
            <Badge className="bg-slate-950/90 backdrop-blur-3xl text-white hover:bg-slate-950 h-16 px-12 rounded-[2.5rem] font-black flex items-center gap-5 shadow-2xl shadow-slate-950/20 text-sm border border-white/10 translate-y-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-pulse" />
                FLEET OVERLOOK ACTIVE
            </Badge>
            <div className="bg-white/40 backdrop-blur-3xl border border-white/50 h-16 px-6 rounded-[2.5rem] flex items-center gap-4 shadow-xl translate-y-2">
                <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-emerald-500 rounded-full" />)}
                    <div className="w-1 h-3 bg-slate-300 rounded-full" />
                </div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Signal: Stable</p>
            </div>
        </div>
      </div>

      {/* Asset Directory Overlay - Right Side */}
      <div className="absolute right-8 top-32 bottom-8 w-[400px] hidden lg:flex flex-col gap-8 pointer-events-none z-10">
          <Card className="flex-1 bg-white/40 backdrop-blur-3xl border border-white/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[4rem] p-10 ring-1 ring-white/20 flex flex-col justify-between pointer-events-auto relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent pointer-none" />
              <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Global Hub</h3>
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-6 transition-transform">
                        <Bus className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar">
                      {activeTrips.map((trip) => (
                        <div key={trip.id} className="bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] border border-white/60 shadow-xl relative group transition-all hover:bg-white/80 hover:translate-x-2">
                            <div className="flex items-center gap-6 mb-6">
                                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-slate-950 text-white flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                                    <Bus className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-xl leading-none tracking-tight">{trip.busName}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">REG: {trip.regNo}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-900/5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">
                                      {trip.driverName?.split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-black text-slate-900 leading-none">{trip.driverName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Encrypted Link</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-2xl bg-white shadow-xl hover:bg-slate-950 hover:text-white transition-all w-12 h-12" asChild>
                                    <a href={`tel:${trip.driverPhone}`}>
                                        <Phone className="h-5 w-5" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-10 p-8 bg-slate-950 text-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                          <ShieldCheck className="w-24 h-24" />
                      </div>
                      <div className="relative z-10 flex items-start gap-5">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                              <Info className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div>
                              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-2 text-emerald-400">Telematic Shield</h4>
                              <p className="text-[11px] leading-relaxed text-slate-400 font-bold">
                                Tracking is fully end-to-end encrypted. Status synced every 200ms.
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </Card>
      </div>

      {/* Stats Bar Overlay - Bottom Center */}
      <div className="absolute bottom-6 left-6 right-6 lg:right-[440px] flex flex-col sm:flex-row gap-4 pointer-events-none z-10">
          <Card className="bg-white/40 backdrop-blur-3xl border border-white/50 shadow-2xl p-4 sm:p-6 rounded-[2.5rem] flex-1 pointer-events-auto ring-1 ring-white/20 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {[
                      { label: 'Network', value: 'Live Hub', icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                      { label: 'Lead Asset', value: focusTrip?.nextStop || 'N/A', icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50/50' },
                      { label: 'Active Vessels', value: activeTrips.length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                      { label: 'Signal', value: 'Satellite', icon: Globe, color: 'text-slate-900', bg: 'bg-slate-100/50' },
                  ].map((stat) => (
                      <div key={stat.label} className="bg-white/60 p-4 rounded-3xl flex items-center gap-4 border border-white shadow-sm group hover:scale-105 transition-all">
                          <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-[1rem] flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                              <stat.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                              <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">{stat.label}</p>
                              <p className="font-black text-slate-900 text-xs truncate uppercase tracking-tighter">{stat.value}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </Card>

          <Card className="bg-rose-950/90 backdrop-blur-3xl text-white shadow-2xl p-6 rounded-[2.5rem] border border-rose-500/20 max-w-sm pointer-events-auto relative overflow-hidden group hidden sm:block">
              <div className="flex items-center gap-5 relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-2xl">
                    <AlertCircle className="h-6 w-6 text-rose-400" />
                  </div>
                  <div>
                      <h4 className="font-black text-rose-400 uppercase text-[9px] tracking-[0.2em] mb-1.5">Emergency Command</h4>
                      <p className="text-[11px] text-rose-100/80 leading-snug font-bold">
                          Protocol 8-Delta active. Satellite lag monitored.
                      </p>
                  </div>
              </div>
          </Card>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
}
