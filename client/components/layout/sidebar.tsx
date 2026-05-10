'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCog,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  DollarSign,
  FileText,
  Package,
  Bell,
  BellRing,
  Clock,
  Settings,
  LogOut,
  User,
  Briefcase,
  ClipboardCheck,
  QrCode,
  Bus,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { SERVER_BASE_URL } from '@/lib/api/apiConfig';
import { schoolConfigAPI } from '@/lib/api';

/**
 * Navigation items configuration with role-based access control
 * Principal (ADMIN) has oversight but not operational access to attendance tracking
 */
const navigationConfig = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'LIBRARIAN', 'ACCOUNTANT', 'HR_MANAGER', 'ADMISSION_MANAGER'] },
  { name: 'Academic Calendar', href: '/dashboard/calendar', icon: CalendarDays, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'HR_MANAGER', 'ADMISSION_MANAGER'] },
  { name: 'User Management', href: '/dashboard/users', icon: UserCog, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Students', href: '/dashboard/students', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'ADMISSION_MANAGER'] },
  { name: 'Teachers', href: '/dashboard/teachers', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'HR Management', href: '/dashboard/hr', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] },
  { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
  { name: 'Assignments', href: '/dashboard/academic/assignments', icon: ClipboardCheck, roles: ['TEACHER'] },
  { name: 'Assignments', href: '/dashboard/assignments', icon: ClipboardCheck, roles: ['STUDENT'] },
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

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>('EduSphere');

  // Fetch school branding
  useEffect(() => {
    schoolConfigAPI.getConfig()
      .then((res) => {
        if (res?.config?.school_logo) {
          const serverBase = SERVER_BASE_URL;
          setSchoolLogo(`${serverBase}${res.config.school_logo}`);
        }
        if (res?.config?.school_name) {
          setSchoolName(res.config.school_name);
        }
      })
      .catch(() => {
        // Silently use defaults
      });
  }, []);

  // Build effective roles list — defensive fallback:
  // Prefer `roles` array (multi-role), but always include the primary `role` string
  // so the sidebar works correctly even if `roles` is empty from an old token/localStorage.
  const primaryRole = user?.role;
  const rolesArray: string[] = user?.roles && user.roles.length > 0 ? user.roles : [];
  const userRoles: string[] = Array.from(new Set([...rolesArray, ...(primaryRole ? [primaryRole] : [])]));

  // Inject QR Scanner if assigned
  const scannerId = user?.teacher?.assignedScannerId || user?.staff?.assignedScannerId;
  const dynamicNav = [...navigationConfig];

  if (scannerId) {
    // Add "QR Scanner" after Attendance or appropriate spot
    const attendanceIndex = dynamicNav.findIndex(item => item.name === 'Attendance');
    dynamicNav.splice(attendanceIndex + 1, 0, {
      name: 'QR Scanner',
      href: `/dashboard/scanners/${scannerId}/prepare`,
      icon: QrCode,
      roles: userRoles // Direct access for the user
    });
  }

  const navigation = dynamicNav.map(item => {
    if (item.name === 'Attendance' && userRoles.includes('STUDENT')) {
      return { ...item, href: '/dashboard/attendance/student' };
    }
    return item;
  }).filter(item =>
    userRoles.some((role) => item.roles.includes(role as any))
  );

  return (
    <div className={cn("flex h-screen w-64 flex-col border-r bg-card", className)}>
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b px-6 gap-3">
        {schoolLogo ? (
          <img src={schoolLogo} alt={schoolName} className="h-8 w-8 object-contain rounded" />
        ) : null}
        <h1 className="text-xl font-bold truncate">{schoolName}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
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

      {/* User Profile & Footer Actions */}
      <div className="border-t p-4 pb-12">
        <Button
          variant="ghost"
          className="mb-4 w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>

        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
          <Avatar className="h-9 w-9 border border-background">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
