'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Navigation, Save, QrCode, MapPin, BarChart2, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scannerAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';


const SCANNER_TYPES = ['ENTRY', 'EXIT', 'CLASSROOM', 'LIBRARY', 'CANTEEN', 'EXAM_HALL', 'CUSTOM'];
const ALL_ROLES = ['STUDENT', 'TEACHER', 'STAFF'];

const ROLE_COLORS: Record<string, string> = {
    STUDENT: 'bg-green-100 text-green-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-yellow-100 text-yellow-700',
};

const STATUS_COLORS: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    ABSENT: 'bg-red-100 text-red-700',
};

interface ScanRecord {
    id: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    geofenceValid?: boolean;
    student?: { user: { firstName: string; lastName: string; role: string } };
    teacher?: { user: { firstName: string; lastName: string; role: string } };
    staff?: { user: { firstName: string; lastName: string; role: string } };
}

interface Scanner {
    id: string;
    name: string;
    location?: string;
    scannerType: string;
    allowedRoles: string[];
    isActive: boolean;
    geofenceRadius: number;
    latitude?: number;
    longitude?: number;
    _count: { attendanceRecords: number };
    attendanceRecords: ScanRecord[];
}

export default function ScannerDetailPage() {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const [scanner, setScanner] = useState<Scanner | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [stats, setStats] = useState<{ totalScans: number; todayScans: number; monthScans: number } | null>(null);

    const isManagementAllowed = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

    // Editable fields
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [scannerType, setScannerType] = useState('ENTRY');
    const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [geofenceRadius, setGeofenceRadius] = useState('10');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [scannerRes, statsRes] = await Promise.all([
                scannerAPI.getById(id),
                scannerAPI.getStats(id),
            ]);
            
            if (scannerRes.success) {
                const s = scannerRes.scanner;
                setScanner(s);
                setName(s.name);
                setLocation(s.location || '');
                setScannerType(s.scannerType);
                setAllowedRoles(s.allowedRoles);
                setGeofenceRadius(String(s.geofenceRadius));
                if (s.latitude) setLatitude(String(s.latitude));
                if (s.longitude) setLongitude(String(s.longitude));
            }
            if (statsRes.success) setStats(statsRes.stats);
        } catch (err) {
            console.error('Failed to fetch scanner data', err);
            toast.error('Failed to load scanner details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const useMyLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                setLatitude(pos.coords.latitude.toFixed(7));
                setLongitude(pos.coords.longitude.toFixed(7));
                setGpsLoading(false);
                toast.success('Location captured');
            },
            () => { toast.error('Failed to get location'); setGpsLoading(false); }
        );
    };

    const toggleRole = (role: string) =>
        setAllowedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await scannerAPI.update(id, {
                name, location, scannerType, allowedRoles,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                geofenceRadius: parseInt(geofenceRadius),
            });
            toast.success('Scanner updated successfully');
        } catch {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async () => {
        if (!scanner) return;
        try {
            await scannerAPI.update(id, { isActive: !scanner.isActive });
            setScanner(prev => prev ? { ...prev, isActive: !prev.isActive } : prev);
            toast.success(`Scanner ${scanner.isActive ? 'deactivated' : 'activated'}`);
        } catch {
            toast.error('Failed to toggle status');
        }
    };

    const getPersonName = (r: ScanRecord) => {
        const u = r.student?.user || r.teacher?.user || r.staff?.user;
        return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
    };

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
    if (!scanner) return (
        <div className="space-y-6">
            <Button variant="ghost" asChild><Link href="/dashboard/scanners"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">Scanner not found</div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/scanners"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Scanners</Link>
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{scanner.name}</h1>
                        <Badge className={scanner.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} variant="secondary">
                            {scanner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    {scanner.location && (
                        <p className="text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" /> {scanner.location}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isManagementAllowed && (
                        <Button
                            variant="outline"
                            onClick={toggleActive}
                            className={scanner.isActive
                                ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }
                        >
                            {scanner.isActive ? <WifiOff className="mr-2 h-4 w-4" /> : <Wifi className="mr-2 h-4 w-4" />}
                            {scanner.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                    )}
                    <Button asChild>
                        <Link href={`/dashboard/scanners/${id}/prepare`}>
                            <QrCode className="mr-2 h-4 w-4" /> Open Scan Mode
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Scans', value: stats.totalScans, icon: <BarChart2 className="h-4 w-4" /> },
                        { label: "Today's Scans", value: stats.todayScans, icon: <QrCode className="h-4 w-4" /> },
                        { label: 'This Month', value: stats.monthScans, icon: <BarChart2 className="h-4 w-4" /> },
                    ].map(s => (
                        <Card key={s.label}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">{s.icon}<span className="text-sm">{s.label}</span></div>
                                <p className="text-3xl font-bold">{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Edit Form */}
                {/* Configuration - Only for Admin/HR */}
                {isManagementAllowed ? (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration</CardTitle>
                                <CardDescription>Update scanner settings and permissions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Scanner Name</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Type</Label>
                                        <select
                                            value={scannerType}
                                            onChange={e => setScannerType(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            {SCANNER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Location Label</Label>
                                        <Input value={location} onChange={e => setLocation(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Allowed Roles</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {ALL_ROLES.map(role => (
                                            <button
                                                type="button"
                                                key={role}
                                                onClick={() => toggleRole(role)}
                                                className={`inline-flex items-center rounded-md border-2 px-3 py-1.5 text-sm font-semibold cursor-pointer transition-all ${allowedRoles.includes(role)
                                                    ? `${ROLE_COLORS[role]} border-current`
                                                    : 'bg-background text-muted-foreground border-border hover:border-primary'
                                                    }`}
                                            >
                                                {role} {allowedRoles.includes(role) && '✓'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>GPS Geofence</CardTitle>
                                <CardDescription>Scans outside this radius will be rejected</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Latitude</Label>
                                        <Input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Longitude</Label>
                                        <Input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Radius (metres)</Label>
                                    <Input type="number" min="5" max="500" value={geofenceRadius} onChange={e => setGeofenceRadius(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="button" variant="outline" onClick={useMyLocation} disabled={gpsLoading}>
                                        <Navigation className="mr-2 h-4 w-4" />
                                        {gpsLoading ? 'Getting…' : 'Use My Location'}
                                    </Button>
                                    {latitude && longitude && (
                                        <span className="text-sm text-green-600 font-medium">
                                            ✅ {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Information</CardTitle>
                                <CardDescription>Current scanner settings (Read Only)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Type</Label>
                                        <p className="font-medium mt-1">{scannerType.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Location</Label>
                                        <p className="font-medium mt-1">{location || 'Not set'}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Allowed Roles</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {allowedRoles.map(role => (
                                            <Badge key={role} className={ROLE_COLORS[role]} variant="secondary">
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">GPS Status</Label>
                                    <p className="mt-1 text-sm">
                                        {latitude ? (
                                            <span className="text-green-600">✅ Active Geofence ({geofenceRadius}m)</span>
                                        ) : (
                                            <span className="text-muted-foreground italic">Geofence not configured</span>
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Recent Scans */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Scans</CardTitle>
                        <CardDescription>Last 20 attendance records from this scanner</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {scanner.attendanceRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <QrCode className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1} />
                                <p className="text-sm text-muted-foreground">No scans recorded yet</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Person</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>GPS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scanner.attendanceRecords.map(r => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{getPersonName(r)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {r.checkInTime
                                                        ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : '—'}
                                                    {r.checkOutTime &&
                                                        ` → ${new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'} variant="secondary">
                                                        {r.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {r.geofenceValid == null ? '—' : r.geofenceValid ? '✅' : '❌'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
