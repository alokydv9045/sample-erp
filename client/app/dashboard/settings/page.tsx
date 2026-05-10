'use client';

import { useState, useEffect, useRef } from 'react';
import { SERVER_BASE_URL } from '@/lib/api/apiConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { schoolConfigAPI } from '@/lib/api';
import { Upload, Image as ImageIcon, Loader2, CheckCircle2, School } from 'lucide-react';
import { toast } from 'sonner';

export default function SchoolSettingsPage() {
    const [config, setConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [schoolName, setSchoolName] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await schoolConfigAPI.getConfig();
            setConfig(res.config || {});
            setSchoolName(res.config?.school_name || '');
            toast.error('Failed to load school configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await schoolConfigAPI.uploadLogo(file);
            setConfig(prev => ({ ...prev, school_logo: res.logoUrl }));
            showSuccess('Logo uploaded successfully!');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveName = async () => {
        if (!schoolName.trim()) return;
        setSaving(true);
        try {
            await schoolConfigAPI.updateConfig({ key: 'school_name', value: schoolName.trim() });
            setConfig(prev => ({ ...prev, school_name: schoolName.trim() }));
            showSuccess('School name updated!');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to update school name');
        } finally {
            setSaving(false);
        }
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const serverBase = SERVER_BASE_URL;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <School className="h-6 w-6" />
                    School Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage school branding — logo and name appear on report cards, fee slips, and the dashboard.
                </p>
            </div>

            {successMsg && (
                <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {successMsg}
                </div>
            )}

            {/* Logo Upload */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        School Logo
                    </CardTitle>
                    <CardDescription>
                        Upload your school logo. It will appear on the sidebar, report cards, and fee receipts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current Logo Preview */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="shrink-0 h-24 w-24 rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/30 overflow-hidden">
                            {config.school_logo ? (
                                <img
                                    src={`${serverBase}${config.school_logo}`}
                                    alt="School Logo"
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground opacity-40" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".png,.jpg,.jpeg,.svg,.webp"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {config.school_logo ? 'Change Logo' : 'Upload Logo'}
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground">PNG, JPG, SVG, or WebP — Max 5MB</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* School Name */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5 text-muted-foreground" />
                        School Name
                    </CardTitle>
                    <CardDescription>
                        This name appears on report cards, fee slips, and official documents.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <Label htmlFor="school-name">School Name</Label>
                            <Input
                                id="school-name"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                placeholder="Enter school name"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleSaveName} disabled={saving || !schoolName.trim()}>
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Save'
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
