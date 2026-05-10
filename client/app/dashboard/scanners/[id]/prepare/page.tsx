'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Calendar, UserCheck, Users, School, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { scannerAPI } from '@/lib/api';



interface Scanner {
    id: string;
    name: string;
    scannerType: string;
    allowedRoles: string[];
}

export default function PrepareScanPage() {
    const router = useRouter();
    const { id: scannerId } = useParams<{ id: string }>();

    const [scanner, setScanner] = useState<Scanner | null>(null);
    const [loading, setLoading] = useState(true);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [action, setAction] = useState<'checkin' | 'checkout'>('checkin');

    useEffect(() => {
        scannerAPI.getById(scannerId)
            .then(d => {
                if (d.success) {
                    setScanner(d.scanner);
                }
            })
            .catch(() => toast.error('Failed to load scanner'))
            .finally(() => setLoading(false));
    }, [scannerId]);

    const handleStart = () => {
        const params = new URLSearchParams({
            date,
            action,
        });

        router.push(`/dashboard/scanners/${scannerId}/live?${params.toString()}`);
    };

    if (loading) return <div className="p-8 text-center">Loading scanner details...</div>;
    if (!scanner) return <div className="p-8 text-center text-destructive">Scanner not found.</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/scanners/${scannerId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                    </Link>
                </Button>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Prepare Scanning Session</h1>
                <p className="text-muted-foreground font-medium">
                    Configure your scanning parameters for <span className="text-primary">{scanner.name}</span>
                </p>
            </div>

            <Card className="border-2 border-primary/10 shadow-lg">
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Session Parameters
                    </CardTitle>
                    <CardDescription>Specify the date and action for this scanning session</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Date */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Attendance Date
                            </Label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>

                        {/* Action */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                Scanning Action
                            </Label>
                            <div className="flex p-1 bg-muted rounded-lg border">
                                <button
                                    onClick={() => setAction('checkin')}
                                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${action === 'checkin' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Check-In
                                </button>
                                <button
                                    onClick={() => setAction('checkout')}
                                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${action === 'checkout' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Check-Out
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        <Button
                            className="w-full text-lg h-12 shadow-md hover:shadow-lg transition-all"
                            onClick={handleStart}
                        >
                            <QrCode className="mr-2 h-5 w-5" />
                            Start Scanning Mode
                        </Button>
                        <div className="text-center text-xs text-muted-foreground mt-4">
                            All scans will be recorded as <Badge variant="outline" className="text-[10px] py-0">{action.toUpperCase()}</Badge> on {new Date(date).toLocaleDateString()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
