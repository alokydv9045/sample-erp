'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Wifi, WifiOff, Loader2, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { scannerAPI, attendanceAPI, userAPI } from '@/lib/api';


const PREVIEW_SECONDS = 2;

interface ScanUser {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
}

interface LiveFeedEntry {
    id: string;
    action: string;
    userName: string;
    userRole: string;
    time: string;
    distanceMetres?: number;
    isError: boolean;
    message?: string;
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
}

const ROLE_COLORS: Record<string, string> = {
    STUDENT: 'bg-green-100 text-green-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-yellow-100 text-yellow-700',
};

// Module-level guard: prevents React StrictMode double-effect from
// creating two Html5Qrcode instances simultaneously.
let cameraInstanceActive = false;


export default function LiveScanPage() {
    return (
        <Suspense fallback={<div>Loading Scanner...</div>}>
            <LiveScanContent />
        </Suspense>
    );
}

function LiveScanContent() {
    const { id: scannerId } = useParams<{ id: string }>();
    const searchParams = useSearchParams();

    // Session Parameters from /prepare
    const sessionDate = searchParams.get('date');
    const sessionAction = searchParams.get('action') as 'checkin' | 'checkout' | null;

    const [scanner, setScanner] = useState<Scanner | null>(null);
    const [scannerLoading, setScannerLoading] = useState(true);
    const [gpsReady, setGpsReady] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [previewUser, setPreviewUser] = useState<ScanUser | null>(null);
    const [previewQrPayload, setPreviewQrPayload] = useState('');
    const [countdown, setCountdown] = useState(PREVIEW_SECONDS);
    const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [liveFeed, setLiveFeed] = useState<LiveFeedEntry[]>([]);

    const posRef = useRef<{ lat: number; lng: number } | null>(null);
    const scannerRef = useRef<unknown>(null);   // Html5Qrcode instance
    const scanningRef = useRef(false);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Per-payload cooldown: prevents 10fps camera from counting same QR twice
    const lastScannedRef = useRef<Map<string, number>>(new Map());
    const readerDivId = 'qr-reader-div';

    // ── Load scanner info ───────────────────────────────────────────────
    useEffect(() => {
        scannerAPI.getById(scannerId)
            .then(d => { if (d.success) setScanner(d.scanner); })
            .catch(() => toast.error('Failed to load scanner'))
            .finally(() => setScannerLoading(false));
    }, [scannerId]);

    // ── GPS watcher ─────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            pos => { posRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setGpsReady(true); },
            () => setGpsReady(false),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // ── Submit attendance ───────────────────────────────────────────────
    const submitAttendance = useCallback(async (qrPayload: string) => {
        const pos = posRef.current;
        try {
            const data = await attendanceAPI.qrScan({
                qrPayload, scannerId,
                scanLat: pos?.lat ?? null,
                scanLng: pos?.lng ?? null,
                // Session parameters
                action: sessionAction,
                date: sessionDate,
            });

            const label = data.action === 'checkin' ? 'Check-In' : 'Check-Out';
            const userName = `${data.user?.firstName} ${data.user?.lastName}`;
            setFlash({ type: 'success', message: `${label} — ${userName}` });
            setLiveFeed(prev => {
                // Dedup: skip if the same user+action was added within 5s
                const last = prev[0];
                if (!last?.isError && last?.userName === userName &&
                    last?.action === data.action &&
                    Date.now() - parseInt(last.id) < 5000) return prev;
                return [{
                    id: Date.now().toString(), action: data.action,
                    userName,
                    userRole: data.user?.role ?? '',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    distanceMetres: data.distanceMetres, isError: false,
                }, ...prev].slice(0, 50);
            });
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Scan rejected';
            setFlash({ type: 'error', message: errorMsg });
            setLiveFeed(prev => {
                // Dedup: skip if the last error is identical within 5s
                const last = prev[0];
                if (last?.isError && last.message === errorMsg &&
                    Date.now() - parseInt(last.id) < 5000) return prev;
                return [{
                    id: Date.now().toString(), action: 'error',
                    userName: '—', userRole: '',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    distanceMetres: err.response?.data?.distanceMetres, isError: true, message: errorMsg,
                }, ...prev].slice(0, 50);
            });
        }

        // Reset scan gate after a delay so camera can accept next person
        setTimeout(() => { setFlash(null); scanningRef.current = false; }, 3000);
    }, [scannerId, sessionAction, sessionDate]);

    // ── Cancel preview ──────────────────────────────────────────────────
    const cancelPreview = useCallback(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setPreviewUser(null);
        setPreviewQrPayload('');
        scanningRef.current = false;
    }, []);

    // ── Decode callback: fetch user info → show 2-sec preview ──────────
    const onQRDecoded = useCallback(async (qrPayload: string) => {
        if (scanningRef.current) return;

        // Cooldown: ignore the same QR decoded again within 3 seconds
        const now = Date.now();
        const lastTime = lastScannedRef.current.get(qrPayload) ?? 0;
        if (now - lastTime < 3000) return;
        lastScannedRef.current.set(qrPayload, now);

        scanningRef.current = true;

        try {
            const parsed = JSON.parse(qrPayload);
            const userId = parsed?.uid;
            if (!userId) throw new Error('invalid');

            const data = await userAPI.getById(userId);
            const u = data;

            setPreviewUser({ id: userId, firstName: u.firstName, lastName: u.lastName, role: u.role, avatar: u.avatar });
            setPreviewQrPayload(qrPayload);
            setCountdown(PREVIEW_SECONDS);

            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    const next = parseFloat((prev - 0.1).toFixed(1));
                    if (next <= 0) {
                        clearInterval(countdownRef.current!);
                        setPreviewUser(null);
                        setPreviewQrPayload('');
                        submitAttendance(qrPayload);
                        return 0;
                    }
                    return next;
                });
            }, 100);
        } catch {
            // Couldn't get user info — submit directly
            await submitAttendance(qrPayload);
        }
    }, [submitAttendance]);

    // ── Camera: dynamically import html5-qrcode (client-only) ──────────
    useEffect(() => {
        let stopped = false;

        const startCamera = async () => {
            try {
                // Dynamic import avoids SSR issues with browser-only library
                const { Html5Qrcode } = await import('html5-qrcode');

                // Wait for the DOM element to be present
                let el = document.getElementById(readerDivId);
                let tries = 0;
                while (!el && tries < 20) {
                    await new Promise(r => setTimeout(r, 100));
                    el = document.getElementById(readerDivId);
                    tries++;
                }
                if (!el || stopped) return;

                // Singleton guard: abort if another instance was created already
                if (cameraInstanceActive) return;
                cameraInstanceActive = true;

                const qr = new Html5Qrcode(readerDivId);
                scannerRef.current = qr;

                await qr.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    onQRDecoded,
                    () => { /* ignore frame-level errors */ }
                );

                if (!stopped) setCameraActive(true);
            } catch (err: unknown) {
                if (!stopped) {
                    const msg = err instanceof Error ? err.message : 'Camera access denied';
                    setCameraError(msg);
                    setCameraActive(false);
                }
            }
        };

        startCamera();

        return () => {
            stopped = true;
            cameraInstanceActive = false;         // allow re-mount on HMR / navigation
            const qr = scannerRef.current as { isScanning?: boolean; stop?: () => Promise<void>; clear?: () => void } | null;
            if (qr?.isScanning && qr.stop) {
                qr.stop().then(() => qr.clear?.()).catch(() => { });
            }
        };
         
    }, [onQRDecoded]);

    // ── Loading / error states ──────────────────────────────────────────
    if (scannerLoading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
    if (!scanner) return <div className="p-6 text-destructive">Scanner not found.</div>;

    const progressPct = Math.max(0, ((PREVIEW_SECONDS - countdown) / PREVIEW_SECONDS) * 100);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/scanners/${scannerId}`}>
                            <ArrowLeft className="mr-1 h-4 w-4" /> {scanner.name}
                        </Link>
                    </Button>
                    <Badge className="bg-purple-100 text-purple-700" variant="secondary">
                        {scanner.scannerType.replace('_', ' ')}
                    </Badge>
                    {scanner.location && (
                        <span className="text-sm text-muted-foreground">{scanner.location}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        className={gpsReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                        variant="secondary"
                    >
                        {gpsReady
                            ? <><Wifi className="mr-1 h-3 w-3 inline" />GPS Ready</>
                            : <><WifiOff className="mr-1 h-3 w-3 inline" />GPS Pending</>
                        }
                    </Badge>
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                        Scanning: {scanner.allowedRoles.join(', ')}
                    </span>
                </div>
            </div>

            {/* Session Info Banner */}
            {sessionAction && (
                <div className={`p-3 rounded-lg flex items-center justify-between border shadow-sm ${sessionAction === 'checkin' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${sessionAction === 'checkin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {sessionAction === 'checkin' ? <UserCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wide">
                                {sessionAction} Mode Active
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {sessionDate} · Ready for Scans
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs hover:bg-background/50">
                        <Link href={`/dashboard/scanners/${scannerId}/prepare`}>
                            Change Params
                        </Link>
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Camera column */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="relative min-h-[320px]">

                                {/* Camera viewfinder — always rendered so DOM element exists */}
                                <div
                                    id={readerDivId}
                                    className={`rounded-lg overflow-hidden w-full ${previewUser || flash ? 'invisible' : ''}`}
                                />

                                {/* 2-second Preview Card overlay */}
                                {previewUser && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm rounded-lg">
                                        <div className="w-full max-w-xs mx-auto p-6 text-center space-y-3">

                                            {/* Avatar */}
                                            <div className="mx-auto h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary">
                                                {previewUser.avatar ? (
                                                    <Image
                                                        src={previewUser.avatar}
                                                        alt={previewUser.firstName}
                                                        width={80} height={80}
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-3xl font-bold text-primary">
                                                        {previewUser.firstName?.[0]?.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Name & role */}
                                            <div>
                                                <h2 className="text-xl font-bold">
                                                    {previewUser.firstName} {previewUser.lastName}
                                                </h2>
                                                <Badge
                                                    className={ROLE_COLORS[previewUser.role] ?? 'bg-gray-100 text-gray-700'}
                                                    variant="secondary"
                                                >
                                                    {previewUser.role}
                                                </Badge>
                                            </div>

                                            <p className="text-muted-foreground text-sm">
                                                ⏱ {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {posRef.current && scanner.latitude && (
                                                    <span className="ml-2">📍 Checking location…</span>
                                                )}
                                            </p>

                                            {/* Countdown progress */}
                                            <div className="space-y-1">
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-100"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Auto-saving in {Math.max(0, countdown).toFixed(1)}s
                                                </p>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={cancelPreview}
                                            >
                                                ✕ Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Flash result */}
                                {flash && !previewUser && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm rounded-lg">
                                        <div className="text-center p-6 space-y-2">
                                            <div className="text-5xl">{flash.type === 'success' ? '✅' : '❌'}</div>
                                            <p className={`text-lg font-semibold ${flash.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {flash.message}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status bar */}
                            <p className="text-center text-sm text-muted-foreground">
                                {cameraError
                                    ? `⚠️ ${cameraError} — check browser camera permissions`
                                    : cameraActive
                                        ? '🟢 Camera active — point at QR code'
                                        : <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Initialising camera…</span>
                                }
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Live feed */}
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <h3 className="font-semibold">Live Feed</h3>
                        {liveFeed.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">
                                Scans will appear here in real-time
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                {liveFeed.map(entry => (
                                    <div
                                        key={entry.id}
                                        className={`rounded-md border-l-4 p-3 text-sm space-y-0.5 ${entry.isError
                                            ? 'border-red-400 bg-red-50'
                                            : entry.action === 'checkin'
                                                ? 'border-green-400 bg-green-50'
                                                : 'border-blue-400 bg-blue-50'
                                            }`}
                                    >
                                        {entry.isError ? (
                                            <p className="text-red-700 font-medium">{entry.message}</p>
                                        ) : (
                                            <>
                                                <p className="font-semibold">{entry.userName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {entry.action === 'checkin' ? '✅ Check-In' : '🔵 Check-Out'} · {entry.time}
                                                </p>
                                                {entry.userRole && (
                                                    <Badge className={ROLE_COLORS[entry.userRole] ?? 'bg-gray-100 text-gray-700'} variant="secondary">
                                                        {entry.userRole}
                                                    </Badge>
                                                )}
                                                {entry.distanceMetres != null && (
                                                    <p className="text-xs text-muted-foreground">📍 {entry.distanceMetres}m from scanner</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
        #${readerDivId} { width: 100% !important; }
        #${readerDivId} video { border-radius: 8px; width: 100% !important; }
        #${readerDivId} img[alt="Info icon"] { display: none !important; }
        #${readerDivId}__dashboard_section_csr span { display: none !important; }
        #${readerDivId}__header_message { display: none !important; }
      `}</style>
        </div>
    );
}
