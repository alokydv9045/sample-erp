'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Wifi, WifiOff, QrCode, MapPin, BarChart2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scannerAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';



const SCANNER_TYPE_COLORS: Record<string, string> = {
    ENTRY: 'bg-green-100 text-green-700',
    EXIT: 'bg-red-100 text-red-700',
    CLASSROOM: 'bg-blue-100 text-blue-700',
    LIBRARY: 'bg-yellow-100 text-yellow-700',
    CANTEEN: 'bg-teal-100 text-teal-700',
    EXAM_HALL: 'bg-purple-100 text-purple-700',
    CUSTOM: 'bg-gray-100 text-gray-700',
};

const ROLE_COLORS: Record<string, string> = {
    STUDENT: 'bg-green-100 text-green-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-yellow-100 text-yellow-700',
    PARENT: 'bg-orange-100 text-orange-700',
};

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
}

export default function ScannersPage() {
    const { user } = useAuth();
    const [scanners, setScanners] = useState<Scanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const isManagementAllowed = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

    useEffect(() => {
        fetchScanners();
    }, []);

    const fetchScanners = () => {
        setLoading(true);
        scannerAPI.getAll()
            .then(d => { if (d.success) setScanners(d.scanners); })
            .catch(() => toast.error('Failed to fetch scanners'))
            .finally(() => setLoading(false));
    };

    const toggleActive = async (scanner: Scanner) => {
        try {
            setTogglingId(scanner.id);
            await scannerAPI.update(scanner.id, { isActive: !scanner.isActive });
            setScanners(prev => prev.map(s => s.id === scanner.id ? { ...s, isActive: !s.isActive } : s));
            toast.success(`Scanner ${scanner.isActive ? 'deactivated' : 'activated'}`);
        } catch {
            toast.error('Failed to update scanner');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">QR Scanners</h1>
                    <p className="text-muted-foreground">Manage scanner devices and their attendance permissions</p>
                </div>
                {isManagementAllowed && (
                    <Button asChild>
                        <Link href="/dashboard/scanners/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Scanner
                        </Link>
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Scanner Devices</CardTitle>
                    <CardDescription>
                        {scanners.length} scanner{scanners.length !== 1 ? 's' : ''} registered
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : scanners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <QrCode className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={1} />
                            <p className="text-lg font-medium">No scanners yet</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first QR scanner to start tracking attendance
                            </p>
                            {isManagementAllowed && (
                                <Button asChild>
                                    <Link href="/dashboard/scanners/new">
                                        <Plus className="mr-2 h-4 w-4" /> Create Scanner
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Allowed Roles</TableHead>
                                        <TableHead>Geofence</TableHead>
                                        <TableHead>Scans</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scanners.map(scanner => (
                                        <TableRow key={scanner.id}>
                                            <TableCell className="font-medium">{scanner.name}</TableCell>
                                            <TableCell>
                                                <Badge className={SCANNER_TYPE_COLORS[scanner.scannerType] ?? 'bg-gray-100 text-gray-700'} variant="secondary">
                                                    {scanner.scannerType.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {scanner.location ? (
                                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <MapPin className="h-3 w-3" /> {scanner.location}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {scanner.allowedRoles.map(role => (
                                                        <Badge key={role} className={ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700'} variant="secondary">
                                                            {role}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {scanner.latitude ? (
                                                    <span className="text-sm">{scanner.geofenceRadius}m</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Not set</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1 text-sm">
                                                    <BarChart2 className="h-3 w-3 text-muted-foreground" />
                                                    {scanner._count.attendanceRecords}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={scanner.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                                    variant="secondary"
                                                >
                                                    {scanner.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isManagementAllowed && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title={scanner.isActive ? 'Deactivate' : 'Activate'}
                                                            disabled={togglingId === scanner.id}
                                                            onClick={() => toggleActive(scanner)}
                                                            className={scanner.isActive
                                                                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                            }
                                                        >
                                                            {scanner.isActive ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                    {isManagementAllowed && (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/dashboard/scanners/${scanner.id}`}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button size="sm" asChild>
                                                        <Link href={`/dashboard/scanners/${scanner.id}/live`}>
                                                            <QrCode className="mr-1 h-3 w-3" /> Scan
                                                        </Link>
                                                    </Button>
                                                </div>
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
    );
}
