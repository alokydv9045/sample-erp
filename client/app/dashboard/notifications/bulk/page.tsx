'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Send, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import apiClient from '@/lib/api/client';

const TARGETS = [
  { value: 'ALL_STUDENTS', label: 'All Students (all parent phones)' },
  { value: 'CLASS',        label: 'By Class' },
  { value: 'SECTION',      label: 'By Class & Section' },
  { value: 'INDIVIDUAL',   label: 'Individual Student' },
];

const NOTIF_TYPES = ['CUSTOM','ANNOUNCEMENT','FEE_REMINDER','HOMEWORK','ATTENDANCE'];

export default function BulkSendPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    target: 'ALL_STUDENTS', classId: '', sectionId: '', studentId: '',
    message: '', notifType: 'CUSTOM', scheduledAt: '',
  });
  const [classes, setClasses]   = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (user && !['SUPER_ADMIN','ADMIN','NOTIFICATION_MANAGER'].some(r => (user.roles||[user.role]).includes(r)))
      router.replace('/dashboard');
  }, [user, router]);

  // Load classes on mount
  useEffect(() => {
    apiClient.get('/academic/classes')
      .then(res => setClasses(res.data.classes || res.data || [])).catch(() => {});
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!form.classId) { setSections([]); return; }
    apiClient.get(`/academic/sections?classId=${form.classId}`)
      .then(res => setSections(res.data.sections || res.data || [])).catch(() => {});
  }, [form.classId]);

  // Load students for INDIVIDUAL target
  useEffect(() => {
    if (form.target !== 'INDIVIDUAL') { setStudents([]); return; }
    apiClient.get('/students?limit=200')
      .then(res => setStudents(res.data.students || res.data || [])).catch(() => {});
  }, [form.target]);

  const send = async () => {
    if (!form.message.trim()) { toast.error('Message is empty', { description: 'Please type a message before sending.', duration: 3000 }); return; }
    setSending(true);
    try {
      const body: any = { target: form.target, message: form.message, notifType: form.notifType };
      if (form.scheduledAt) body.scheduledAt = form.scheduledAt;
      if (form.target === 'CLASS' && form.classId) body.classId = form.classId;
      if (form.target === 'SECTION' && form.sectionId) body.sectionId = form.sectionId;
      if (form.target === 'INDIVIDUAL' && form.studentId) body.studentId = form.studentId;

      const { data } = await apiClient.post('/notifications/bulk-send', body);
      toast.success('Messages Queued', {
        description: data.message || `Messages queued for ${form.target.replace('_', ' ').toLowerCase()}.`,
        duration: 4000,
      });
      setForm(f => ({ ...f, message: '', scheduledAt: '' }));
    } catch (err: any) {
      toast.error('Failed to send', {
        description: err.response?.data?.message || 'An unexpected error occurred.',
        duration: 4000,
      });
    } finally { setSending(false); }
  };

  return (
    <div className="max-w-xl space-y-4">
      <button
        onClick={() => router.push('/dashboard/notifications')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-xl font-bold flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Bulk Messaging</h1>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Send To</label>
          <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value, classId: '', sectionId: '', studentId: '' }))}
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Class picker */}
        {(form.target === 'CLASS' || form.target === 'SECTION') && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Class</label>
            <select value={form.classId} onChange={e => setForm(f => ({...f, classId: e.target.value, sectionId: ''}))}
              className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Choose class —</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Section picker */}
        {form.target === 'SECTION' && form.classId && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Section</label>
            <select value={form.sectionId} onChange={e => setForm(f => ({...f, sectionId: e.target.value}))}
              className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Choose section —</option>
              {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Student picker */}
        {form.target === 'INDIVIDUAL' && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Student</label>
            <select value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))}
              className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Choose student —</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.user?.firstName} {s.user?.lastName} ({s.admissionNumber})</option>)}
            </select>
          </div>
        )}

        {/* Notification type */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Notification Type</label>
          <select value={form.notifType} onChange={e => setForm(f => ({...f, notifType: e.target.value}))}
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {NOTIF_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Message</label>
          <textarea rows={5} value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
            placeholder="Type your message here... Only phones registered in student profiles will receive this."
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          <p className="text-xs text-muted-foreground mt-1">⚠️ Messages are only sent to parent phone numbers stored in the student profile.</p>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Schedule (optional)</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))}
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-muted-foreground mt-1">Leave blank to queue immediately (sent within ~1 minute).</p>
        </div>

        <button onClick={send} disabled={sending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Queuing...' : 'Send / Queue Messages'}
        </button>
      </div>
    </div>
  );
}
