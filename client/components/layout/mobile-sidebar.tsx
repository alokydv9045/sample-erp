'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, X, LayoutDashboard, Users, UserCog, GraduationCap, CalendarCheck, BookOpen, DollarSign, FileText, Package, Bell, BellRing, Clock, Settings, User, Briefcase, ClipboardCheck, QrCode, Bus } from 'lucide-react';
import { schoolConfigAPI } from '@/lib/api';

const navigationConfig = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'LIBRARIAN', 'ACCOUNTANT', 'HR_MANAGER', 'ADMISSION_MANAGER'] },
    { name: 'User Management', href: '/dashboard/users', icon: UserCog, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Students', href: '/dashboard/students', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'ADMISSION_MANAGER'] },
    { name: 'Teachers', href: '/dashboard/teachers', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'HR Management', href: '/dashboard/hr', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
    { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    { name: 'QR Scanners', href: '/dashboard/scanners', icon: QrCode, roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
    { name: 'Academic', href: '/dashboard/academic', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'] },
    { name: 'Fees', href: '/dashboard/fees', icon: DollarSign, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STUDENT'] },
    { name: 'Examinations', href: '/dashboard/exams', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    { name: 'Marks Entry', href: '/dashboard/exams/marks-entry', icon: ClipboardCheck, roles: ['TEACHER'] },
    { name: 'Library', href: '/dashboard/library', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'] },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'] },
    { name: 'Transport', href: '/dashboard/transport', icon: Bus, roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'STUDENT', 'PARENT', 'ADMISSION_MANAGER'] },
    { name: 'My Schedule', href: '/dashboard/schedule', icon: Clock, roles: ['TEACHER'] },
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'] },
    { name: 'Notification Management', href: '/dashboard/notifications', icon: BellRing, roles: ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'] },
    { name: 'Services', href: '/dashboard/services', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'] },
    { name: 'School Settings', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
    { name: 'My Profile', href: '/dashboard/profile', icon: User, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'INVENTORY_MANAGER', 'HR_MANAGER', 'ADMISSION_MANAGER', 'NOTIFICATION_MANAGER'] },
];

export function MobileSidebar({ open, setOpen }: { open: boolean; setOpen: (val: boolean) => void }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [schoolLogo, setSchoolLogo] = React.useState<string | null>(null);
    const [schoolName, setSchoolName] = React.useState<string>('EduSphere');

    React.useEffect(() => {
        schoolConfigAPI.getConfig()
            .then((res) => {
                if (res?.config?.school_logo) {
                    const serverBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
                    setSchoolLogo(`${serverBase}${res.config.school_logo}`);
                }
                if (res?.config?.school_name) {
                    setSchoolName(res.config.school_name);
                }
            })
            .catch(() => { });
    }, []);

    const primaryRole = user?.role;
    const rolesArray: string[] = user?.roles && user.roles.length > 0 ? user.roles : [];
    const userRoles: string[] = Array.from(new Set([...rolesArray, ...(primaryRole ? [primaryRole] : [])]));
    const navigation = navigationConfig.filter(item =>
        userRoles.some((role) => item.roles.includes(role as any))
    );

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-lg transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
                    <div className="flex items-center gap-3">
                        {schoolLogo && <img src={schoolLogo} alt={schoolName} className="h-8 w-8 object-contain rounded" />}
                        <h1 className="text-xl font-bold truncate">{schoolName}</h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t p-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>
                                {user?.firstName?.[0]}
                                {user?.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="mt-3 w-full justify-start"
                        onClick={() => { logout(); setOpen(false); }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </>
    );
}
