'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState, useRef, useCallback } from 'react';
import { studentAPI, userAPI, documentAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Loader2, Plus, Building2, Shield, Mail, Globe, Calendar,
    MapPin, User, Map, GraduationCap, Users, FileText,
    HeartPulse, File, Trash2, Download, CheckCircle2,
    CalendarDays, Phone, Briefcase, Camera, ExternalLink,
    Lock, Key, Clock, Award, QrCode, Eye, EyeOff
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserQRCode from '@/components/qr/UserQRCode';

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700 font-medium',
    ADMIN: 'bg-purple-100 text-purple-700 font-medium',
    TEACHER: 'bg-blue-100 text-blue-700 font-medium',
    STUDENT: 'bg-green-100 text-green-700 font-medium',
    PARENT: 'bg-teal-100 text-teal-700 font-medium',
    ACCOUNTANT: 'bg-orange-100 text-orange-700 font-medium',
    LIBRARIAN: 'bg-indigo-100 text-indigo-700 font-medium',
    INVENTORY_MANAGER: 'bg-yellow-100 text-yellow-700 font-medium',
    HR_MANAGER: 'bg-pink-100 text-pink-700 font-medium',
    ADMISSION_MANAGER: 'bg-cyan-100 text-cyan-700 font-medium',
};

// Helper Components for Cleaner Main Render
function InfoRow({ label, value, icon: Icon, valueClass = '' }: { label: string, value: React.ReactNode, icon?: any, valueClass?: string }) {
    return (
        <div className="flex flex-row items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-md gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0 max-w-[45%]">
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="font-medium truncate">{label}</span>
            </div>
            <div className={`text-sm font-semibold text-right flex-1 break-words min-w-0 ${valueClass}`}>
                {value || '—'}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { user } = useAuth();
    const { isAdmin, isStudent } = usePermissions();
    const [studentData, setStudentData] = useState<any>(null);
    const [staffData, setStaffData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [qrIssued, setQrIssued] = useState(false);
    const [qrIssuedAt, setQrIssuedAt] = useState<string | null>(null);
    const [isTogglingLock, setIsTogglingLock] = useState(false);
    const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);

    // Change Password State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error("New passwords do not match");
        }
        if (passwordData.newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setIsChangingPassword(true);
        try {
            await userAPI.changePassword(passwordData);
            toast.success("Password updated successfully");
            setIsPasswordModalOpen(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const fetchDocuments = useCallback(async (studentId: string) => {
        try {
            const res = await documentAPI.getAll(studentId);
            setDocuments(res.documents || []);
        } catch (error) {
            console.error('Fetch documents error:', error);
            toast.error('Failed to load documents');
        }
    }, []);

    const fetchStudentProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await studentAPI.getMe();
            if (res && res.student) {
                setStudentData(res.student);
                fetchDocuments(res.student.id);
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, [fetchDocuments]);

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        try {
            const res = await userAPI.getById(user.id);
            if (res) {
                setQrIssued(res.qrIssued || false);
                setQrIssuedAt(res.qrIssuedAt || null);
                if (!isStudent) {
                    setStaffData(res.staff || res.teacher || null);
                }
            }
        } catch (error) {
            console.error('Fetch user data error:', error);
        }
    }, [user, isStudent]);

    useEffect(() => {
        if (user) {
            fetchUserData();
            if (isStudent) {
                fetchStudentProfile();
            }
        }
    }, [isStudent, user, fetchStudentProfile, fetchUserData]);

    const handleToggleQRLock = async () => {
        if (!user || !isAdmin) return;

        setIsTogglingLock(true);
        try {
            const newStatus = !qrIssued;
            await userAPI.toggleQRIssued(user.id, newStatus);
            setQrIssued(newStatus);
            setQrIssuedAt(newStatus ? new Date().toISOString() : null);
            toast.success(`Digital ID ${newStatus ? 'Locked' : 'Unlocked'} successfully`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update Digital ID status");
        } finally {
            setIsTogglingLock(false);
        }
    };

    const handleRegenerateQR = async () => {
        if (!user || !isAdmin) return;
        if (qrIssued) {
            return toast.error("Cannot regenerate an Issued/Locked Digital ID. Please unlock it first.");
        }

        if (!confirm("Are you sure? This will invalidate any existing QR codes for this user.")) return;

        setIsRegeneratingQR(true);
        try {
            await userAPI.regenerateQR(user.id);
            toast.success("QR Code regenerated successfully");
            window.location.reload(); // Refresh to show new QR
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to regenerate QR Code");
        } finally {
            setIsRegeneratingQR(false);
        }
    };

    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingAvatar(true);
        try {
            await userAPI.updateAvatar(user.id, file);
            toast.success('Profile picture updated!');
            window.location.reload(); // Refresh to update avatar everywhere
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error('Failed to update profile picture');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !studentData) return;

        const docType = prompt('Enter document type (e.g., Aadhaar, TC, Results):');
        if (!docType) return;

        setUploadingDoc(true);
        try {
            await documentAPI.upload(studentData.id, {
                file,
                documentType: docType,
                documentName: file.name
            });
            toast.success('Document uploaded successfully!');
            fetchDocuments(studentData.id);
        } catch (error) {
            console.error('Document upload error:', error);
            toast.error('Failed to upload document');
        } finally {
            setUploadingDoc(false);
            if (docInputRef.current) docInputRef.current.value = '';
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await documentAPI.delete(docId);
            toast.success('Document deleted');
            if (studentData) fetchDocuments(studentData.id);
        } catch (error) {
            console.error('Delete document error:', error);
            toast.error('Failed to delete document');
        }
    };

    if (!user) return null;

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;

    const renderBasicProfile = () => {
        return (
            <div className="space-y-6">
                {/* 1. Header Profile Summary - Standard Card */}
                <Card className="w-full shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <Avatar className="h-24 w-24 border-2 border-border/50 shadow-sm transition-opacity hover:opacity-90">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={fullName} className="h-full w-full object-cover rounded-full" />
                                    ) : (
                                        <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-sm ring-2 ring-background">
                                    {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                                </div>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-3">
                                    <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
                                    <Badge variant="outline" className={`uppercase ${ROLE_COLORS[user.role] || ''}`}>
                                        {user.role.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</div>
                                    <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {user.phone || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <Button variant="outline" className="w-full md:w-auto" onClick={handleAvatarClick}>
                                    <Camera className="mr-2 h-4 w-4" /> Update Avatar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Key Stats Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Last Session</CardTitle>
                            <div className="rounded-full bg-blue-100 p-2"><Clock className="h-4 w-4 text-blue-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Initial session'}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Activity Status</CardTitle>
                            <div className="rounded-full bg-emerald-100 p-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight">{user.isActive ? 'Active' : 'Offline'}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Employment</CardTitle>
                            <div className="rounded-full bg-purple-100 p-2"><Briefcase className="h-4 w-4 text-purple-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight truncate">{user.role.split('_').join(' ')}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Joined Date</CardTitle>
                            <div className="rounded-full bg-teal-100 p-2"><CalendarDays className="h-4 w-4 text-teal-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Detailed Info Grids */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-1 md:col-span-2 shadow-sm border-none shadow-md">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                                <InfoRow icon={User} label="Gender" value={user.gender || 'Not specified'} valueClass="capitalize" />
                                <InfoRow icon={Calendar} label="Date of Birth" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'} />
                                <InfoRow icon={HeartPulse} label="Blood Group" value={user.bloodGroup || 'Not assigned'} />
                                <InfoRow icon={MapPin} label="Address" value={<span className="text-muted-foreground italic font-normal">{user.address || 'No location registered'}</span>} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-none shadow-md">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" /> Professional Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-1">
                            <InfoRow icon={Award} label="Employee ID" value={staffData?.employeeId || 'ID_PENDING'} valueClass="font-mono" />
                            <InfoRow icon={Briefcase} label="Designation" value={staffData?.designation || user.role.replace('_', ' ')} />
                            <InfoRow icon={Building2} label="Department" value={staffData?.department || 'CORE_SYSTEM'} />
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 shadow-sm border-none shadow-md">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" /> Security Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex flex-col gap-3">
                                <InfoRow
                                    icon={Clock}
                                    label="Last Password Change"
                                    value={user.lastPasswordChange ? new Date(user.lastPasswordChange).toLocaleDateString() : <span className="text-destructive font-bold">Action Required</span>}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 mt-2"
                                    onClick={() => setIsPasswordModalOpen(true)}
                                >
                                    <Key className="h-4 w-4" /> Change Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-sm border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-primary/5 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-primary" /> Digital Identity & QR Attendance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="bg-white p-4 rounded-xl shadow-inner border flex flex-col items-center gap-3 shrink-0">
                                    <UserQRCode userId={user.id} userName={fullName} userRole={user.role} isAdmin={isAdmin} />
                                    <div className="flex flex-col items-center gap-1">
                                        <Badge variant={qrIssued ? "default" : "secondary"} className="font-mono text-[10px]">
                                            {qrIssued ? 'ISSUED & LOCKED' : 'DIGITAL ID'}
                                        </Badge>
                                        {qrIssuedAt && <span className="text-[9px] text-muted-foreground uppercase">Since {new Date(qrIssuedAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full ${qrIssued ? 'bg-emerald-500' : 'bg-primary'}`} /> QR Code Info
                                                {qrIssued && <Lock className="h-3 w-3 text-muted-foreground inline" />}
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                This QR code is used for scanning attendance at QR scanner devices located throughout the campus.
                                            </p>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant={qrIssued ? "outline" : "default"}
                                                    size="sm"
                                                    className="h-8 gap-2"
                                                    onClick={handleToggleQRLock}
                                                    disabled={isTogglingLock}
                                                >
                                                    {isTogglingLock ? <Loader2 className="h-3 w-3 animate-spin" /> : (qrIssued ? <Key className="h-3 w-3" /> : <Lock className="h-3 w-3" />)}
                                                    {qrIssued ? 'Unlock for Edit' : 'Lock as Issued'}
                                                </Button>
                                                {!qrIssued && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={handleRegenerateQR}
                                                        disabled={isRegeneratingQR}
                                                    >
                                                        {isRegeneratingQR ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 rotate-45" />}
                                                        Regenerate
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <ul className="grid sm:grid-cols-1 gap-3">
                                        {[
                                            "Each user has a unique, permanent QR code tied to their account.",
                                            "The QR is valid at any active scanner the user's role is allowed on.",
                                            "Admins can regenerate the QR if it is lost or compromised.",
                                            "GPS geofencing is enforced by the scanner device, not the QR code itself."
                                        ].map((text, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                                <span>{text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    const renderStudentDashboard = () => {
        if (loading) {
            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/40 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">Loading Academic Registry...</p>
                </div>
            );
        }

        const father = studentData?.parents?.find((p: any) => p.relationship === 'FATHER')?.parent;
        const mother = studentData?.parents?.find((p: any) => p.relationship === 'MOTHER')?.parent;

        return (
            <div className="space-y-6">
                {/* 1. Header Profile Summary - Standard Card */}
                <Card className="w-full shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <Avatar className="h-24 w-24 border-2 border-border/50 shadow-sm transition-opacity hover:opacity-90">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={fullName} className="h-full w-full object-cover rounded-full" />
                                    ) : (
                                        <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-sm ring-2 ring-background">
                                    {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                                </div>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-3">
                                    <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
                                    <Badge variant="outline" className={`uppercase ${ROLE_COLORS.STUDENT}`}>
                                        {studentData?.admissionNumber || 'ADM_PENDING'}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {studentData?.currentClass?.name} • {studentData?.section?.name}</div>
                                    <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Roll No. {studentData?.rollNumber || 'TBD'}</div>
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active Profile</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <Button variant="outline" className="w-full md:w-auto" onClick={() => docInputRef.current?.click()}>
                                    <Plus className="mr-2 h-4 w-4" /> Upload Document
                                </Button>
                                <input type="file" ref={docInputRef} className="hidden" onChange={handleDocUpload} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Key Stats Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Batch</CardTitle>
                            <div className="rounded-full bg-blue-100 p-2"><Calendar className="h-4 w-4 text-blue-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight">{studentData?.academicYear?.name || '2024-25'}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Medium</CardTitle>
                            <div className="rounded-full bg-emerald-100 p-2"><Globe className="h-4 w-4 text-emerald-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight">{studentData?.medium || 'ENGLISH'}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Joined</CardTitle>
                            <div className="rounded-full bg-purple-100 p-2"><CalendarDays className="h-4 w-4 text-purple-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight">{studentData?.joiningDate ? new Date(studentData.joiningDate).toLocaleDateString() : '—'}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow bg-red-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Emergency Info</CardTitle>
                            <div className="rounded-full bg-red-100 p-2"><HeartPulse className="h-4 w-4 text-red-600" /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight text-red-600 truncate">{studentData?.emergencyPhone || 'UNSET'}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Detailed Info Grids */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-1 md:col-span-2 shadow-sm border-none shadow-md">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" /> Core Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                                <InfoRow icon={User} label="Gender" value={user.gender || '—'} valueClass="capitalize" />
                                <InfoRow icon={Calendar} label="Date of Birth" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'} />
                                <InfoRow icon={HeartPulse} label="Blood Group" value={user.bloodGroup || '—'} />
                                <InfoRow icon={Globe} label="Religion" value={studentData?.religion || 'INDIAN'} />
                                <InfoRow icon={Users} label="Caste Group" value={studentData?.caste || 'GENERAL'} />
                                <InfoRow icon={Award} label="Nationality" value={studentData?.nationality || 'INDIAN'} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-none shadow-md">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <HeartPulse className="h-5 w-5 text-primary" /> Health Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medical Notes</p>
                                <p className="text-sm font-medium">{studentData?.medicalConditions || 'No critical conditions logged'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allergies</p>
                                <p className="text-sm font-medium">{studentData?.allergies || 'None reported'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contact</p>
                                <p className="text-sm font-bold text-destructive">{studentData?.emergencyContact || 'Unset'} - {studentData?.emergencyPhone || 'No number'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parents & Academic Block */}
                    <Card className="col-span-1 shadow-sm border-none shadow-md">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Guardian Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold border-b pb-1">Father</h4>
                                <InfoRow label="Name" value={father?.firstName ? `${father.firstName} ${father.lastName}` : '—'} />
                                <InfoRow label="Phone" value={father?.phone} valueClass="font-mono text-xs" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold border-b pb-1">Mother</h4>
                                <InfoRow label="Name" value={mother?.firstName ? `${mother.firstName} ${mother.lastName}` : '—'} />
                                <InfoRow label="Phone" value={mother?.phone} valueClass="font-mono text-xs" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-2 shadow-sm border-none shadow-md flex flex-col">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/30 pb-4 border-b gap-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Documents Asset Vault
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1">
                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center h-full border-2 border-dashed rounded-lg border-muted">
                                    <File className="h-8 w-8 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-primary/10 rounded-md">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-semibold truncate">{doc.documentType}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDoc(doc.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QR Code Identity Card */}
                    <Card className="col-span-1 md:col-span-3 shadow-sm border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-primary/5 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-primary" /> Digital Identity & QR Attendance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="bg-white p-4 rounded-xl shadow-inner border flex flex-col items-center gap-3 shrink-0">
                                    <UserQRCode userId={user.id} userName={fullName} userRole={user.role} isAdmin={isAdmin} />
                                    <div className="flex flex-col items-center gap-1">
                                        <Badge variant={qrIssued ? "default" : "secondary"} className="font-mono text-[10px]">
                                            {qrIssued ? 'ISSUED & LOCKED' : 'STUDENT ID'}
                                        </Badge>
                                        {qrIssuedAt && <span className="text-[9px] text-muted-foreground uppercase">Since {new Date(qrIssuedAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full ${qrIssued ? 'bg-emerald-500' : 'bg-primary'}`} /> QR Code Info
                                                {qrIssued && <Lock className="h-3 w-3 text-muted-foreground inline" />}
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                This QR code is used for scanning attendance at QR scanner devices located throughout the campus.
                                            </p>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant={qrIssued ? "outline" : "default"}
                                                    size="sm"
                                                    className="h-8 gap-2"
                                                    onClick={handleToggleQRLock}
                                                    disabled={isTogglingLock}
                                                >
                                                    {isTogglingLock ? <Loader2 className="h-3 w-3 animate-spin" /> : (qrIssued ? <Key className="h-3 w-3" /> : <Lock className="h-3 w-3" />)}
                                                    {qrIssued ? 'Unlock for Edit' : 'Lock as Issued'}
                                                </Button>
                                                {!qrIssued && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={handleRegenerateQR}
                                                        disabled={isRegeneratingQR}
                                                    >
                                                        {isRegeneratingQR ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 rotate-45" />}
                                                        Regenerate
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                                        {[
                                            "Each user has a unique, permanent QR code tied to their account.",
                                            "The QR is valid at any active scanner the user's role is allowed on.",
                                            "Admins can regenerate the QR if it is lost or compromised.",
                                            "GPS geofencing is enforced by the scanner device, not the QR code itself."
                                        ].map((text, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                                <span>{text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account and view your detailed information
                    </p>
                </div>
            </div>

            {isStudent ? renderStudentDashboard() : renderBasicProfile()}

            {/* ── Change Password Modal ── */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new secure one.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="oldPassword"
                                    type={showPasswords ? "text" : "password"}
                                    required
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type={showPasswords ? "text" : "password"}
                                required
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPasswords ? "text" : "password"}
                                required
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="px-0 text-xs text-muted-foreground hover:bg-transparent"
                                onClick={() => setShowPasswords(!showPasswords)}
                            >
                                {showPasswords ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                {showPasswords ? "Hide Passwords" : "Show Passwords"}
                            </Button>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)} disabled={isChangingPassword}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isChangingPassword}>
                                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                Update Password
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
