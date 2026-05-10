'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  Bell,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Settings,
  FileText,
  Users,
  Inbox,
  RefreshCw,
} from 'lucide-react';

import apiClient from '@/lib/api/client';

async function fetchDashboard() {
  const { data } = await apiClient.get('/notifications/dashboard');
  return data;
}

interface Stats {
  sentToday: number;
  scheduledCount: number;
  pendingCount: number;
  failedCount: number;
  monthlyCount: number;
}

interface Settings {
  attendanceNotificationTime: string;
  attendanceNotifEnabled: boolean;
  homeworkNotifEnabled: boolean;
  feeReminderEnabled: boolean;
  announcementEnabled: boolean;
}

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'];

const quickLinks = [
  { href: '/dashboard/notifications/settings',  label: 'Notification Settings', icon: Settings,   description: 'Toggle features & scheduled time', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { href: '/dashboard/notifications/templates',  label: 'Message Templates',     icon: FileText,  description: 'Create reusable message templates',  color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { href: '/dashboard/notifications/bulk',       label: 'Bulk Messaging',         icon: Users,     description: 'Send messages to groups',            color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  { href: '/dashboard/notifications/queue',      label: 'Scheduled Messages',     icon: Clock,     description: 'View & manage queued messages',      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  { href: '/dashboard/notifications/logs',       label: 'Message Logs',           icon: Inbox,     description: 'Full delivery history',              color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
];

export default function NotificationHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (user && !ALLOWED_ROLES.some(r => (user.roles || [user.role]).includes(r))) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboard();
      setStats(data.stats);
      setSettings(data.settings);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = stats ? [
    { label: 'Sent Today',           value: stats.sentToday,      icon: CheckCircle2, color: 'text-green-500'  },
    { label: 'Scheduled',            value: stats.scheduledCount, icon: Clock,        color: 'text-blue-500'   },
    { label: 'Pending (Due)',         value: stats.pendingCount,   icon: Send,         color: 'text-orange-500' },
    { label: 'Failed',               value: stats.failedCount,    icon: XCircle,      color: 'text-red-500'    },
    { label: 'This Month',           value: stats.monthlyCount,   icon: BarChart3,    color: 'text-purple-500' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notification Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Centralized notification dashboard — schedule, send, and monitor WhatsApp messages.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-4 flex flex-col gap-2">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <span className="text-2xl font-bold">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Feature status strip */}
      {settings && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Feature Status</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Attendance',   enabled: settings.attendanceNotifEnabled,  time: settings.attendanceNotificationTime },
              { label: 'Homework',     enabled: settings.homeworkNotifEnabled },
              { label: 'Fee Reminder', enabled: settings.feeReminderEnabled },
              { label: 'Announcement', enabled: settings.announcementEnabled },
            ].map((f) => (
              <span
                key={f.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  f.enabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-muted text-muted-foreground line-through'
                }`}
              >
                {f.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {f.label}
                {f.time && f.enabled && <span className="ml-1 opacity-70">@ {f.time}</span>}
              </span>
            ))}
          </div>
          <Link
            href="/dashboard/notifications/settings"
            className="mt-3 inline-flex text-xs text-primary hover:underline items-center gap-1"
          >
            <Settings className="h-3 w-3" /> Manage settings
          </Link>
        </div>
      )}

      {/* Quick link cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-lg border bg-card p-4 hover:border-primary hover:shadow-sm transition-all flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{link.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
