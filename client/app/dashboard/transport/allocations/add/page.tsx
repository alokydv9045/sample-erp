'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Navigation, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  X,
  User
} from 'lucide-react';
import { transportAPI } from '@/lib/api/transport';
import { studentAPI } from '@/lib/api/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function NewAllocationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    routeId: '',
    stopId: '',
    status: 'ACTIVE'
  });

  // Fetch initial routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await transportAPI.getRoutes();
        if (res.data?.success) setRoutes(res.data.routes);
      } catch (err) {
        console.error('Failed to sync routes');
      }
    };
    fetchRoutes();
  }, []);

  // Manual debounce for student search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.substring(0, 10).trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setIsSearching(true);
        const res = await studentAPI.getAll({ search: searchQuery, limit: 5 });
        if (res.students) {
          setSearchResults(res.students);
        }
      } catch (err) {
        console.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (student: any) => {
      setSelectedStudent(student);
      setFormData(prev => ({ ...prev, studentId: student.id }));
      setSearchQuery('');
      setSearchResults([]);
  };

  const handleClearStudent = () => {
      setSelectedStudent(null);
      setFormData(prev => ({ ...prev, studentId: '' }));
  };

  const selectedRoute = routes.find(r => r.id === formData.routeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
        toast.error('Please select a student from the search results.');
        return;
    }
    try {
      setIsLoading(true);
      const res = await transportAPI.assignStudent(formData);
      if (res.data?.success) {
        toast.success('Student allocated successfully!');
        router.push('/dashboard/transport/allocations');
      }
    } catch (err: any) {
      // Improved error handling for 404
      if (err.response?.status === 404) {
          toast.error('Student reference lost. Please select again.');
      } else {
          toast.error('Allocation protocol failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="rounded-2xl hover:bg-slate-100 font-black h-12 px-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </Button>
        <div className="bg-purple-50 text-purple-600 px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Enrollment Officer
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Student Enrollment</h1>
        <p className="text-slate-500 font-medium mt-1">Assign students to specific routes and boarding points.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 ring-1 ring-slate-100 overflow-visible">
            <CardHeader className="p-0 border-b border-slate-100 pb-10 mb-10">
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-4">
                    <Users className="h-8 w-8 text-purple-600" />
                    Identity & Network Selection
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium text-base">Select the student and their designated transport route.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-10">
                <div className="space-y-4 relative">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Search Student (Name or ID)</Label>
                    
                    {!selectedStudent ? (
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                            <Input 
                                placeholder="Type to search students..." 
                                className="h-16 pl-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-purple-500 text-lg font-bold"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-slate-400" />}
                            
                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <Card className="absolute z-50 w-full mt-2 border-none shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                    <div className="p-2 space-y-1">
                                        {searchResults.map(student => (
                                            <div 
                                                key={student.id} 
                                                className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group"
                                                onClick={() => handleSelectStudent(student)}
                                            >
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-slate-900">{student.user.firstName} {student.user.lastName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {student.admissionNumber} • {student.currentClass?.name || 'No Class'}
                                                    </p>
                                                </div>
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-6 bg-purple-50 rounded-[2rem] border-2 border-purple-100 animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                                    <User className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900 leading-tight">
                                        {selectedStudent.user.firstName} {selectedStudent.user.lastName}
                                    </p>
                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest mt-1">
                                        UID: {selectedStudent.admissionNumber} • {selectedStudent.currentClass?.name || 'Class Unassigned'}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                className="h-12 w-12 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                onClick={handleClearStudent}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Designated Route</Label>
                        <Select onValueChange={(v) => setFormData({...formData, routeId: v, stopId: ''})}>
                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus:ring-purple-500 font-bold">
                                <SelectValue placeholder="Select transport line" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                {routes.map((route) => (
                                    <SelectItem key={route.id} value={route.id} className="rounded-xl h-12 font-bold focus:bg-purple-50 focus:text-purple-700">
                                        <div className="flex items-center gap-2">
                                            <Navigation className="h-4 w-4" />
                                            {route.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Pick-up / Drop-off Stop</Label>
                        <Select disabled={!formData.routeId} onValueChange={(v) => setFormData({...formData, stopId: v})}>
                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus:ring-purple-500 font-bold">
                                <SelectValue placeholder="Select stop point" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                {selectedRoute?.stops?.map((stop: any) => (
                                    <SelectItem key={stop.id} value={stop.id} className="rounded-xl h-12 font-bold focus:bg-purple-50 focus:text-purple-700 font-black">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {stop.name} • {stop.arrivalTime}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!formData.routeId && <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-2 flex items-center gap-1 ml-1"><AlertCircle className="h-3 w-3" /> Select route first</p>}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100/50">
             <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 shrink-0">
                    <AlertCircle className="h-7 w-7 text-slate-900" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase text-xs">Distance Validation Protocol</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">
                        The system will automatically calculate the geodetic distance between the student's address and the selected stop to ensure optimal route selection.
                    </p>
                </div>
             </div>
        </Card>

        <div className="flex justify-end gap-5">
            <Button variant="ghost" className="h-16 px-10 rounded-2xl font-black text-slate-400 hover:text-slate-900" type="button" onClick={() => router.back()}>Cancel Enrollment</Button>
            <Button 
                className="h-16 px-14 rounded-2xl bg-purple-600 hover:bg-purple-700 shadow-2xl shadow-purple-600/30 font-black text-white transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50" 
                disabled={isLoading || !formData.studentId || !formData.stopId} 
                type="submit"
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                CONFIRM STUDENT PLAN
            </Button>
        </div>
      </form>
    </div>
  );
}
