'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Clock, RefreshCw, RotateCcw, ArrowLeft } from 'lucide-react';

import apiClient from '@/lib/api/client';

const STATUS_BADGE: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  SENT:       'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  FAILED:     'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

interface QueueEntry {
  id: string; phoneNumber: string; message: string; status: string;
  notifType: string; scheduledAt: string; sentAt?: string; recipientType: string;
}

export default function QueuePage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [items, setItems]   = useState<QueueEntry[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const isAdmin = ['SUPER_ADMIN','ADMIN'].some(r => (user?.roles||[user?.role]).includes(r));

  useEffect(() => {
    if (user && !['SUPER_ADMIN','ADMIN','NOTIFICATION_MANAGER'].some(r => (user.roles||[user.role]).includes(r)))
      router.replace('/dashboard');
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: String(page), limit: '20' };
      if (status) params.status = status;
      const { data } = await apiClient.get('/notifications/queue', { params });
      setItems(data.queue || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to load queue:', err);
    } finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const retryFailed = async () => {
    setRetrying(true);
    try {
      await apiClient.post('/notifications/retry');
      load();
    } catch (err: any) {
      console.error('Failed to retry failed notifications:', err);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push('/dashboard/notifications')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Message Queue <span className="text-sm font-normal text-muted-foreground">({total})</span></h1>
        <div className="flex items-center gap-2">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="rounded border px-3 py-1.5 text-sm bg-background">
            <option value="">All Statuses</option>
            {['PENDING','PROCESSING','SENT','FAILED'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={load} className="flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm hover:bg-accent">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {isAdmin && (
            <button onClick={retryFailed} disabled={retrying}
              className="flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50">
              <RotateCcw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} /> Retry Failed
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">No messages in queue.</div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {['Phone','Type','Status','Scheduled At','Message'].map(h => <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{item.phoneNumber}</td>
                    <td className="px-4 py-3"><span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{item.notifType}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_BADGE[item.status] || ''}`}>{item.status}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(item.scheduledAt).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center gap-3 justify-end text-sm">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded border px-3 py-1 hover:bg-accent disabled:opacity-40">Prev</button>
          <span className="text-muted-foreground">Page {page} of {Math.ceil(total/20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total/20)} className="rounded border px-3 py-1 hover:bg-accent disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
