'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { FileText, Plus, Pencil, Trash2, RefreshCw, X, Save, ArrowLeft, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

import apiClient from '@/lib/api/client';

const TEMPLATE_TYPES = ['ATTENDANCE','HOMEWORK','FEE_REMINDER','ANNOUNCEMENT','CUSTOM'];
const VARIABLE_HINTS = ['{student_name}','{class}','{section}','{status}','{date}','{amount}','{due_date}'];

interface Template {
  id: string; templateName: string; templateType: string; messageBody: string;
  variables: string[]; isActive: boolean; createdAt: string;
}

const EMPTY: Omit<Template,'id'|'createdAt'|'isActive'> = {
  templateName: '', templateType: 'ATTENDANCE', messageBody: '', variables: [],
};

export default function TemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<{ mode: 'create'|'edit'; item?: Template } | null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (user && !['SUPER_ADMIN','ADMIN','NOTIFICATION_MANAGER'].some(r => (user.roles||[user.role]).includes(r)))
      router.replace('/dashboard');
  }, [user, router]);

  const isAdmin = ['SUPER_ADMIN','ADMIN'].some(r => (user?.roles||[user?.role]).includes(r));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/notifications/templates');
      setTemplates(data.templates || []);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }); };
  const openEdit   = (t: Template) => {
    setForm({ templateName: t.templateName, templateType: t.templateType, messageBody: t.messageBody, variables: t.variables });
    setModal({ mode: 'edit', item: t });
  };

  const saveTemplate = async () => {
    if (!form.templateName.trim() || !form.messageBody.trim()) {
      toast.error('Template name and message body are required.');
      return;
    }
    setSaving(true);
    try {
      const url    = modal?.mode === 'edit' ? `/notifications/templates/${modal.item!.id}` : '/notifications/templates';
      const method = modal?.mode === 'edit' ? 'put' : 'post';
      
      const { data } = await apiClient({
        url,
        method,
        data: form,
      });

      toast.success(modal?.mode === 'edit' ? 'Template updated!' : 'Template created!');
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save template.');
    } finally { setSaving(false); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/notifications/templates/${id}`);
      toast.success('Template deleted.');
      load();
    } catch (err: any) {
      toast.error('Failed to delete template.');
    }
  };

  const insertVar = (v: string) => setForm(f => ({ ...f, messageBody: f.messageBody + v }));

  return (
    <div className="space-y-5">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/notifications')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Message Templates
          </h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          No templates yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{t.templateName}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-widest rounded-full bg-primary/10 text-primary px-2 py-0.5">
                    {t.templateType}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-accent" title="Edit template">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {isAdmin && (
                    <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Delete template">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{t.messageBody}</p>
              {t.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.variables.map(v => (
                    <span key={v} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{`{${v}}`}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal — with live message preview */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl border bg-card shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

            {/* Left: Form */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">{modal.mode === 'create' ? 'New Template' : 'Edit Template'}</h2>
                <button onClick={() => setModal(null)} className="rounded-full p-1 hover:bg-accent">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Template Name *</label>
                  <input
                    placeholder="e.g. Attendance Absent Alert"
                    value={form.templateName}
                    onChange={e => setForm(f => ({...f, templateName: e.target.value}))}
                    className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Template Type</label>
                  <select
                    value={form.templateType}
                    onChange={e => setForm(f => ({...f, templateType: e.target.value}))}
                    className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {TEMPLATE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Message Body * — click variable to insert:</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {VARIABLE_HINTS.map(v => (
                      <button
                        key={v}
                        onClick={() => insertVar(v)}
                        className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={7}
                    value={form.messageBody}
                    onChange={e => setForm(f => ({...f, messageBody: e.target.value}))}
                    placeholder={"Hello Parent,\n\nYour child {student_name} from Class {class} attendance on {date} is {status}.\n\n– School ERP"}
                    className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setModal(null)} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </button>
              </div>
            </div>

            {/* Right: WhatsApp-style Preview */}
            <div className="w-full md:w-72 bg-muted/40 border-l flex flex-col p-4 gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                Live Preview
              </div>

              {/* WhatsApp chat bubble */}
              <div
                className="flex-1 rounded-xl overflow-hidden"
                style={{ background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQoU2NkYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==") repeat', backgroundColor: '#e5ddd5' }}
              >
                <div className="p-3 h-full flex items-end">
                  <div className="max-w-[90%] rounded-lg rounded-bl-none bg-white shadow-sm px-3 py-2">
                    <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {form.messageBody || (
                        <span className="text-gray-400 italic">Your message preview will appear here as you type...</span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400 text-right mt-1">11:02 ✓✓</p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Variables like <code className="font-mono bg-muted px-1 rounded">{'{student_name}'}</code> will be replaced when sent
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
