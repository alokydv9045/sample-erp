'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Navigation, 
  Plus, 
  Search, 
  Loader2, 
  Edit, 
  Eye, 
  MapPin,
  Clock,
  Map,
  ArrowRight,
  TrendingUp,
  Users,
  ArrowLeft
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle as LucideAlertCircle } from 'lucide-react';

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rRes, sRes] = await Promise.all([
        transportAPI.getRoutes(),
        transportAPI.getStats()
      ]);
      if (rRes.data?.success) setRoutes(rRes.data.routes);
      if (sRes.data?.success) setStats(sRes.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transport routes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.startLocation && r.startLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.endLocation && r.endLocation.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Synchronizing Route Inventory...</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transport Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">Define smart routes, pick-up points, and live schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-lg hover:bg-slate-100 font-bold h-10 px-4 text-xs" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild className="h-10 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 shadow-md font-bold transition-all text-xs">
            <Link href="/dashboard/transport/routes/add">
              <Plus className="mr-2 h-4 w-4" />
              Create Network
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
            { label: 'Active Routes', value: stats?.activeRoutes || '0', icon: Navigation, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'Total Stops', value: routes.reduce((acc, r) => acc + (r._count?.stops || 0), 0), icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-500' },
            { label: 'Stu. Allocated', value: stats?.totalAllocations || '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-purple-500' },
            { label: 'Efficiency', value: '94%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' },
        ].map((stat) => (
            <Card key={stat.label} className={cn("border-l-4 shadow-sm rounded-xl overflow-hidden", stat.border)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={cn("p-2 rounded-full", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium tracking-tight">System metrics</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg bg-white border-slate-200 focus-visible:ring-slate-900 shadow-sm text-xs"
          />
      </div>

      {error ? (
        <Card className="border-rose-100 bg-rose-50 rounded-3xl p-8 flex items-center gap-4 text-rose-700">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <p className="font-black uppercase text-sm tracking-widest">{typeof error === "string" ? error : JSON.stringify(error)}</p>
        </Card>
      ) : filteredRoutes.length === 0 ? (
        <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Map className="h-20 w-20 mx-auto mb-6 text-slate-200" />
          <h3 className="text-2xl font-black text-slate-900">No Routes Mapped</h3>
          <p className="text-slate-400 mt-2 font-medium">Your transport network is empty. Start by adding a new route.</p>
          <Button variant="outline" asChild className="mt-8 rounded-2xl font-black h-12 px-8 shadow-sm">
            <Link href="/dashboard/transport/routes/add">Add Your First Route</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="group overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md relative bg-white">
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: route.colorCode || '#0F172A' }} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-lg bg-slate-50 text-slate-900 transition-all border shadow-sm">
                        <Navigation className="h-5 w-5" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-none tracking-tight">{route.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5">
                            <span>{route._count?.stops || 0} STOPS</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{route._count?.allocations || 0} ENROLLED</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm border-slate-100" asChild>
                        <Link href={`/dashboard/transport/routes/${route.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm border-slate-100" asChild>
                        <Link href={`/dashboard/transport/routes/${route.id}/edit`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1 mt-1">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-white" />
                            <div className="w-px h-8 bg-slate-200 border-dashed border-l" />
                            <MapPin className="h-3 w-3 text-emerald-500" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Origin</p>
                                <p className="font-bold text-slate-900 text-sm mt-1">{route.startLocation || 'School Campus'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Destination</p>
                                <p className="font-bold text-slate-900 text-sm mt-1">{route.endLocation || 'City Hub'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold shadow-sm text-slate-500 uppercase">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" className="rounded-lg h-9 px-4 font-bold transition-all shadow-sm flex items-center gap-2 text-xs">
                         <TrendingUp className="h-3 w-3" />
                         OPTIMIZE
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCircle({ children, className }: { children?: React.ReactNode, className: string }) {
    return <div className={className}>⚠️</div>
}
