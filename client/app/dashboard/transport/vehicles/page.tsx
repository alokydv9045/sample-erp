'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bus, 
  Plus, 
  Search, 
  Loader2, 
  Edit, 
  Eye, 
  AlertCircle,
  FileText,
  Wrench,
  ShieldAlert,
  ChevronRight,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
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
      const [vRes, sRes] = await Promise.all([
        transportAPI.getVehicles(),
        transportAPI.getStats()
      ]);
      if (vRes.data?.success) setVehicles(vRes.data.vehicles);
      if (sRes.data?.success) setStats(sRes.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: any = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-100',
      OUT_OF_SERVICE: 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return variants[status] || 'bg-slate-50 text-slate-700 border-slate-100';
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Fleet Database...</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fleet Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage transport assets, compliance, and logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-lg hover:bg-slate-100 font-bold h-10 px-4 text-xs" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild className="h-10 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 shadow-md font-bold transition-all text-xs">
            <Link href="/dashboard/transport/vehicles/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
            { label: 'Registered Assets', value: vehicles.length, icon: Bus, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-l-slate-500' },
            { label: 'Maintenance Due', value: stats?.maintenanceCount || '0', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' },
            { label: 'Critical Alerts', value: stats?.expiringDocs || '0', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-l-rose-500' },
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
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium tracking-tight">Real-time status</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100/50">
            <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-900">Inventory Management</CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-medium">Real-time status of {vehicles.length} operational units.</CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Search fleet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-lg bg-white border-slate-200 focus-visible:ring-slate-900 shadow-sm text-xs"
                />
            </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {error ? (
            <div className="m-10 flex items-center gap-4 p-8 rounded-3xl bg-rose-50 text-rose-700 border border-rose-100 font-black uppercase text-xs tracking-widest">
              <AlertCircle className="h-6 w-6" />
              <p>{typeof error === "string" ? error : JSON.stringify(error)}</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-32 bg-slate-50/20">
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Bus className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">No Vehicles Found</h3>
              <p className="text-slate-400 mt-2 font-medium">Try adjusting your search criteria or adding a new unit.</p>
            </div>
          ) : (
            <Table>
                <TableHeader className="bg-slate-50/20">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-10 h-16">VEHICLE IDENTITY</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-16">REGISTRATION</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-16">DRIVE TEAM</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-16 text-center">STATUS</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-400 pr-10 h-16">COMMANDS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="pl-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                            <Bus className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg leading-none">{vehicle.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{vehicle.make} {vehicle.model} • {vehicle.capacity} SEATS</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="px-5 py-2 rounded-xl font-mono text-xs font-black bg-slate-50 border-slate-200 text-slate-700 shadow-sm">
                          {vehicle.registrationNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          {vehicle.primaryDriver ? (
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xl shadow-slate-200">
                                  {vehicle.primaryDriver.user?.firstName?.[0]}{vehicle.primaryDriver.user?.lastName?.[0]}
                              </div>
                              <div>
                                  <p className="text-sm font-black text-slate-900 leading-none">
                                  {vehicle.primaryDriver.user?.firstName} {vehicle.primaryDriver.user?.lastName}
                                  </p>
                                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1.5">VERIFIED PILOT</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 w-fit">
                                <AlertCircle className="h-3 w-3" />
                                UNASSIGNED
                            </span>
                          )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getStatusBadge(vehicle.status)} shadow-none border font-black text-[10px] px-5 py-2 rounded-full`}>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex items-center justify-end gap-3">
                          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95" asChild>
                            <Link href={`/dashboard/transport/vehicles/${vehicle.id}`}>
                              <Eye className="h-5 w-5" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95" asChild>
                            <Link href={`/dashboard/transport/vehicles/${vehicle.id}/edit`}>
                              <Edit className="h-5 w-5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
