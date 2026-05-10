'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Navigation, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scannerAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';


const SCANNER_TYPES = ['ENTRY', 'EXIT', 'CLASSROOM', 'LIBRARY', 'CANTEEN', 'EXAM_HALL', 'CUSTOM'];
const ALL_ROLES = ['STUDENT', 'TEACHER', 'STAFF'];

const ROLE_COLORS: Record<string, string> = {
    STUDENT: 'bg-green-100 text-green-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-yellow-100 text-yellow-700',
};

export default function NewScannerPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [scannerType, setScannerType] = useState('ENTRY');
    const [allowedRoles, setAllowedRoles] = useState<string[]>(['STUDENT']);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [geofenceRadius, setGeofenceRadius] = useState('10');
    const [gpsLoading, setGpsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
            toast.error('Access Denied: You do not have permission to create scanners');
            router.push('/dashboard/scanners');
        }
    }, [user, router]);

    const useMyLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported by your browser'); return; }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toFixed(7));
                setLongitude(pos.coords.longitude.toFixed(7));
                setGpsLoading(false);
                toast.success('Location captured successfully');
            },
            () => { toast.error('Failed to get location. Check browser permissions.'); setGpsLoading(false); }
        );
    };

    const toggleRole = (role: string) => {
        setAllowedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Scanner name is required'); return; }
        if (allowedRoles.length === 0) { toast.error('Select at least one allowed role'); return; }

        setSaving(true);
        try {
            const data = await scannerAPI.create({
                name, location, scannerType, allowedRoles,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                geofenceRadius: parseInt(geofenceRadius) || 10,
            });
            toast.success('Scanner created successfully');
            router.push(`/dashboard/scanners/${data.scanner.id}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to create scanner');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/scanners">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scanners
                    </Link>
                </Button>
            </div>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">New QR Scanner</h1>
                <p className="text-muted-foreground">Configure a new scanner device with geofencing and role permissions</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Set up the scanner name, type, and physical location label</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Scanner Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Main Gate Scanner"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Scanner Type</Label>
                                <select
                                    id="type"
                                    value={scannerType}
                                    onChange={e => setScannerType(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {SCANNER_TYPES.map(t => (
                                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location Label</Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g. Building A - Front Gate"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Allowed Roles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Allowed Roles</CardTitle>
                        <CardDescription>Select which user roles this scanner is authorized to record attendance for</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {ALL_ROLES.map(role => (
                                <button
                                    type="button"
                                    key={role}
                                    onClick={() => toggleRole(role)}
                                    className={`inline-flex items-center rounded-md border-2 px-4 py-2 text-sm font-semibold cursor-pointer transition-all ${allowedRoles.includes(role)
                                        ? `${ROLE_COLORS[role]} border-current`
                                        : 'bg-background text-muted-foreground border-border hover:border-primary'
                                        }`}
                                >
                                    {role}
                                    {allowedRoles.includes(role) && <span className="ml-2">✓</span>}
                                </button>
                            ))}
                        </div>
                        {allowedRoles.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-sm text-muted-foreground">Selected:</span>
                                {allowedRoles.map(r => (
                                    <Badge key={r} className={ROLE_COLORS[r]} variant="secondary">{r}</Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* GPS Geofence */}
                <Card>
                    <CardHeader>
                        <CardTitle>GPS Geofence</CardTitle>
                        <CardDescription>
                            Scans from devices outside this radius will be automatically rejected.
                            Click "Use My Location" while physically standing at the scanner to lock GPS coordinates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                            <strong>Tip:</strong> Click "Use My Location" while you are physically at the scanner device location.
                            This locks the GPS anchor point for geofencing.
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                    id="lat"
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    onChange={e => setLatitude(e.target.value)}
                                    placeholder="Auto-fill below"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lng">Longitude</Label>
                                <Input
                                    id="lng"
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    onChange={e => setLongitude(e.target.value)}
                                    placeholder="Auto-fill below"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="radius">Geofence Radius (metres)</Label>
                                <Input
                                    id="radius"
                                    type="number"
                                    min="5"
                                    max="500"
                                    value={geofenceRadius}
                                    onChange={e => setGeofenceRadius(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button type="button" variant="outline" onClick={useMyLocation} disabled={gpsLoading}>
                                <Navigation className="mr-2 h-4 w-4" />
                                {gpsLoading ? 'Getting Location…' : 'Use My Location'}
                            </Button>
                            {latitude && longitude && (
                                <span className="text-sm text-green-600 font-medium">
                                    ✅ GPS set: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)} (±{geofenceRadius}m)
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/scanners">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Creating…' : 'Create Scanner'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
