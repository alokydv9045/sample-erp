'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings2, 
  Bell, 
  Map as MapIcon, 
  Shield, 
  Zap, 
  ArrowLeft,
  Save,
  Info,
  Smartphone,
  Mail,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { transportAPI } from '@/lib/api/transport';

export default function TransportSettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    geofenceThreshold: 500,
    strictRouteDeviation: true,
    pushNotifications: true,
    emailSummaries: false
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
        try {
            const res = await transportAPI.getSettings();
            if (res.data?.success) setSettings(res.data.settings);
        } catch (err) {
            console.error('Settings fetch error:', err);
        }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
        setIsSaving(true);
        const res = await transportAPI.updateSettings(settings);
        if (res.data?.success) {
            toast.success("Institutional configurations synchronized successfully.");
        }
    } catch (err) {
        toast.error("Failed to synchronize configurations.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
              <Settings2 className="h-10 w-10 text-slate-900" />
              Network Settings
           </h1>
           <p className="text-slate-500 font-medium mt-1">Configure geofencing thresholds and automated alert priority.</p>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="ghost" className="rounded-2xl h-14 w-14 p-0 hover:bg-slate-100" onClick={() => router.back()}>
               <ArrowLeft className="h-6 w-6" />
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-2xl flex items-center gap-3 transition-all active:scale-95">
               {isSaving ? <Zap className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
               Sync Config
            </Button>
        </div>
      </div>

      <div className="grid gap-10">
        <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <MapIcon className="h-5 w-5 text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Geofencing & Proximity</h3>
            </div>
            
            <Card className="border-none shadow-xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100">
                <div className="space-y-12">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                       <div className="space-y-1.5 max-w-md">
                           <Label className="text-lg font-black text-slate-900">Arrival Alert Threshold</Label>
                           <p className="text-sm text-slate-500 font-medium leading-relaxed">Distance from stop at which the automated "Bus Approaching" notification triggers for parents.</p>
                       </div>
                       <div className="w-full md:w-64 space-y-6">
                           <div className="flex items-center justify-between font-black text-slate-900 text-sm">
                               <span>Range</span>
                               <span className="bg-slate-100 px-4 py-1 rounded-full">{settings.geofenceThreshold}m</span>
                           </div>
                           <Slider 
                            value={[settings.geofenceThreshold]} 
                            onValueChange={(val) => setSettings({...settings, geofenceThreshold: val[0]})}
                            max={2000} 
                            step={100} 
                            className="py-4" 
                           />
                       </div>
                   </div>

                   <div className="h-px bg-slate-100 w-full" />

                   <div className="flex items-center justify-between gap-8">
                        <div className="space-y-1.5">
                            <Label className="text-lg font-black text-slate-900">Strict Route Deviation</Label>
                            <p className="text-sm text-slate-500 font-medium">Trigger immediate manager alert if vehicle deviates {'>'}{settings.geofenceThreshold}m from mapped path.</p>
                        </div>
                        <Switch 
                            checked={settings.strictRouteDeviation} 
                            onCheckedChange={(checked) => setSettings({...settings, strictRouteDeviation: checked})}
                            className="data-[state=checked]:bg-slate-900" 
                        />
                   </div>
                </div>
            </Card>
        </section>

        <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Bell className="h-5 w-5 text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Communication Matrix</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900">Push Notifications</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Real-time telemetry updates for students and parents via the mobile portal.</p>
                        </div>
                    </div>
                    <div className="mt-10 flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">High Priority</span>
                        <Switch 
                            checked={settings.pushNotifications} 
                            onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                            className="data-[state=checked]:bg-emerald-500" 
                        />
                    </div>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[3rem] p-10 ring-1 ring-slate-100 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900">Email Summaries</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Daily dispatch reports sent to transport admins containing fuel and distance metrics.</p>
                        </div>
                    </div>
                    <div className="mt-10 flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">Operational</span>
                        <Switch 
                            checked={settings.emailSummaries} 
                            onCheckedChange={(checked) => setSettings({...settings, emailSummaries: checked})}
                            className="data-[state=checked]:bg-blue-600" 
                        />
                    </div>
                </Card>
            </div>
        </section>

        <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Shield className="h-5 w-5 text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Security & Privacy</h3>
            </div>

            <Card className="border-none shadow-xl bg-slate-950 text-white rounded-[3rem] p-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                    <Navigation className="w-40 h-40" />
                 </div>
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="space-y-4 max-w-lg">
                        <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-emerald-400" />
                            <h4 className="font-black text-2xl tracking-tight">Encrypted Telemetry Hub</h4>
                        </div>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">
                            All GPS data is end-to-end encrypted. Vehicle history is automatically purged every 90 days as per regional compliance standards.
                        </p>
                     </div>
                     <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/20 hover:bg-white/10 text-white font-black">Adjust Protocol</Button>
                 </div>
            </Card>
        </section>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 flex items-start gap-6">
          <Info className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
          <div className="space-y-2">
              <h4 className="font-black text-amber-900 uppercase text-[10px] tracking-widest">Administrator Note</h4>
              <p className="text-sm text-amber-800 leading-relaxed font-bold">
                  Updating these settings will recalibrate the active fleet sensors and may take up to 2-3 minutes to synchronize across all mobile terminals in the field.
              </p>
          </div>
      </div>
    </div>
  );
}
