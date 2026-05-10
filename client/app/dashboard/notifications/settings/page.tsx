'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Settings, Save, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import apiClient from '@/lib/api/client';

const ADMIN_ONLY = ['SUPER_ADMIN', 'ADMIN'];

interface SettingsData {
  attendanceNotificationTime: string;
  attendanceNotifEnabled: boolean;
  homeworkNotifEnabled: boolean;
  feeReminderEnabled: boolean;
  announcementEnabled: boolean;
}

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = ADMIN_ONLY.some(r => (user?.roles || [user?.role]).includes(r));

  const [form, setForm] = useState<SettingsData>({
    attendanceNotificationTime: '10:30',
    attendanceNotifEnabled: true,
    homeworkNotifEnabled: false,
    feeReminderEnabled: true,
    announcementEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (user && !['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'].some(r => (user.roles || [user.role]).includes(r))) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/notifications/settings');
      if (data.settings) setForm(data.settings);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const { data } = await apiClient.put('/notifications/settings', form);
      toast.success('Notification Settings', {
        description: 'Settings saved successfully.',
        duration: 3000,
      });
      // Redirect back to the Notification Management hub
      router.push('/dashboard/notifications');
    } catch (err: any) {
      toast.error('Failed to save settings', {
        description: err.response?.data?.message || 'An unexpected error occurred.',
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof SettingsData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.checked }));
  };

  if (loading) return <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin h-6 w-6 text-primary" /></div>;

  return (
    <div className="max-w-xl space-y-4">
      <button
        onClick={() => router.push('/dashboard/notifications')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Notification Settings</h1>
      </div>

      <div className="rounded-lg border bg-card divide-y">
        {/* Attendance */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Attendance Notifications</p>
            <p className="text-sm text-muted-foreground">Send WhatsApp to parents when attendance is marked</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.attendanceNotifEnabled} onChange={toggle('attendanceNotifEnabled')} disabled={!isAdmin} />
            <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
          </label>
        </div>

        {/* Attendance time */}
        {form.attendanceNotifEnabled && (
          <div className="p-4 flex items-center justify-between gap-4 bg-muted/30">
            <div>
              <p className="font-medium text-sm">Scheduled Delivery Time</p>
              <p className="text-xs text-muted-foreground">Attendance messages will be sent at this time daily</p>
            </div>
            <input
              type="time"
              value={form.attendanceNotificationTime}
              onChange={(e) => setForm((f) => ({ ...f, attendanceNotificationTime: e.target.value }))}
              disabled={!isAdmin}
              className="rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
        )}

        {/* Homework */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Homework Notifications</p>
            <p className="text-sm text-muted-foreground">Notify parents when teachers assign homework</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.homeworkNotifEnabled} onChange={toggle('homeworkNotifEnabled')} disabled={!isAdmin} />
            <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
          </label>
        </div>

        {/* Fee reminder */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Fee Reminders</p>
            <p className="text-sm text-muted-foreground">Send periodic fee due reminders to parents</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.feeReminderEnabled} onChange={toggle('feeReminderEnabled')} disabled={!isAdmin} />
            <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
          </label>
        </div>

        {/* Announcements */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Announcement Notifications</p>
            <p className="text-sm text-muted-foreground">Send notifications when new announcements posted</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.announcementEnabled} onChange={toggle('announcementEnabled')} disabled={!isAdmin} />
            <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
          </label>
        </div>
      </div>

      {isAdmin && (
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      )}

      {!isAdmin && (
        <p className="text-sm text-muted-foreground italic">Only Admins can modify notification settings.</p>
      )}
    </div>
  );
}

