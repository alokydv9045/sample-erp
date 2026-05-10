'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Shuffle, 
  Plus, 
  AlertTriangle,
  Navigation,
  School,
  ArrowRight,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AllocationsPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState<any[]>([]);
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
      const [aRes, sRes] = await Promise.all([
        transportAPI.getAllocations(),
        transportAPI.getStats()
      ]);
      
      if (aRes.data?.success) {
        setAllocations(aRes.data.allocations || []);
      }
      
      if (sRes.data?.success) {
        setStats(sRes.data.stats);
      }
    } catch (err: any) {
      setError('Connection failure. Data synchronization interrupted.');
      console.error('Failed to sync allocation ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = allocations.filter(a => 
    a.student.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Allocation Ledger...</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Allocations</h1>
          <p className="text-sm text-muted-foreground mt-1">Assign students to stops and routes based on geocoding</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-lg hover:bg-slate-100 font-bold h-10 px-4 text-xs" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button variant="outline" className="h-10 px-4 rounded-lg border-slate-200 font-bold flex items-center gap-2 transition-all hover:bg-slate-50 text-xs">
            <Shuffle className="h-4 w-4" />
            Batch Tools
          </Button>
          <Button className="h-10 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 shadow-md font-bold transition-all text-xs" asChild>
            <Link href="/dashboard/transport/allocations/add">
                <Plus className="mr-2 h-4 w-4" />
                New Allocation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
            { label: 'Enrolled Students', value: stats?.totalAllocations || '0', icon: Users, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-l-slate-500' },
            { label: 'Pending Requests', value: '12', icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' },
            { label: 'Route Coverage', value: '98%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
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

      <Card className="border shadow-sm rounded-xl overflow-hidden bg-white mt-4">
        <CardHeader className="bg-slate-50/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100/50">
            <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-900">Allocation Ledger</CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-medium">Real-time student transport assignment registry.</CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-lg bg-white border-slate-200 focus-visible:ring-slate-900 shadow-sm text-xs"
                />
            </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50/20">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-10 h-16">STUDENT IDENTITY</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-16">ASSIGNED NETWORK</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-16">BOARDING POINT</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-16 text-center">STATUS</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-400 pr-10 h-16">COMMAND</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="pl-10 py-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                                        {item.student.user.firstName[0]}{item.student.user.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-base leading-none">{item.student.user.firstName} {item.student.user.lastName}</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">{item.student.currentClass?.name || 'GENERIC ENROLLMENT'}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <Navigation className="h-5 w-5 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <span className="font-black text-slate-700 text-sm">{item.route.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 font-bold text-slate-500 text-sm">
                                    <MapPin className="h-4 w-4 text-rose-500" />
                                    {item.stop.name}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge className="bg-emerald-50 text-emerald-700 shadow-none border border-emerald-100 font-black text-[10px] px-4 py-1.5 rounded-full">
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-10">
                                <Button variant="outline" className="rounded-2xl font-black h-12 px-6 hover:bg-slate-900 hover:text-white transition-all shadow-sm border-slate-100">
                                    Modify Plan
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="bg-slate-50/50 p-6 flex items-center justify-center border-t border-slate-100/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
            <School className="h-3 w-3" />
            EduSphere Transport Intelligence Protocol
        </CardFooter>
      </Card>

      <Card className="border shadow-sm bg-amber-50 rounded-xl overflow-hidden">
           <CardContent className="p-6">
             <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-amber-100 shrink-0">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Geocoding Advisory</h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                        A critical set of 12 students are currently pending allocation due to missing coordinate traces. Run the batch-sync tool to resolve.
                    </p>
                </div>
                <Button className="bg-slate-950 text-white hover:bg-slate-800 font-bold px-6 h-10 rounded-lg shadow-sm active:scale-95 transition-all text-xs">
                    RESOLVE NOW
                </Button>
             </div>
           </CardContent>
      </Card>
    </div>
  );
}
