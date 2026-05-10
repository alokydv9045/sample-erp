'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { userAPI, User } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Mail, Phone, Calendar, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import UserQRCode from '@/components/qr/UserQRCode';
import { useAuth } from '@/contexts/auth-context';

// Role-specific permission descriptions
const ROLE_PERMISSIONS: Record<string, { label: string; permissions: string[] }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    permissions: [
      'Full unrestricted system access',
      'Manage all schools and tenants',
      'Access to all modules and features',
      'Manage global system settings',
    ],
  },
  ADMIN: {
    label: 'Admin (Principal)',
    permissions: [
      'Full system access and management capabilities',
      'Manage all users and their permissions',
      'Access to all modules and features',
      'View and manage system settings',
    ],
  },
  TEACHER: {
    label: 'Teacher',
    permissions: [
      'Manage assigned classes and students',
      'Take attendance and manage grades',
      'Create and manage exams',
      'View student academic records',
    ],
  },
  STUDENT: {
    label: 'Student',
    permissions: [
      'Access personal academic records',
      'View assignments and submit work',
      'Check attendance and grades',
      'View announcements and notices',
    ],
  },
  PARENT: {
    label: 'Parent',
    permissions: [
      'View linked student information',
      'Monitor academic progress',
      'View attendance records',
      'Receive school communications',
    ],
  },
  ACCOUNTANT: {
    label: 'Accountant',
    permissions: [
      'Manage fee collection and payments',
      'Generate financial reports',
      'Track expenses and income',
      'View student payment history',
    ],
  },
  LIBRARIAN: {
    label: 'Librarian',
    permissions: [
      'Manage library book catalog',
      'Issue and return books',
      'Track book availability',
      'Generate library reports',
    ],
  },
  HR_MANAGER: {
    label: 'HR Manager',
    permissions: [
      'Manage employee records and profiles',
      'Set and update salary structures',
      'Generate and process monthly payroll',
      'Mark payroll as paid',
      'View payroll reports and summaries',
    ],
  },
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  TEACHER: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-green-100 text-green-700',
  PARENT: 'bg-orange-100 text-orange-700',
  ACCOUNTANT: 'bg-yellow-100 text-yellow-700',
  LIBRARIAN: 'bg-pink-100 text-pink-700',
  HR_MANAGER: 'bg-teal-100 text-teal-700',
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Password Reset State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const data = await userAPI.getById(id);
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsResetting(true);
      await userAPI.resetPassword(id, newPassword);
      setIsResetOpen(false);
      setNewPassword('');
      toast.success('Password reset successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const getStatusBadge = (isActive: boolean) =>
    isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  // Compute effective roles list (roles[] if present, else [role])
  const effectiveRoles: string[] =
    (user as any).roles && (user as any).roles.length > 0
      ? (user as any).roles
      : [user.role];

  // Collect all unique permissions across all assigned roles
  const allPermissions = effectiveRoles.flatMap(
    (role) => ROLE_PERMISSIONS[role]?.permissions ?? []
  );
  const uniquePermissions = Array.from(new Set(allPermissions));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/users/${id}/edit`}>Edit User</Link>
          </Button>
          <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Lock className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter a new password for{' '}
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  . This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="text"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters required.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResetting || newPassword.length < 6}
                >
                  {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h3>
              {/* All roles as badges */}
              <div className="mt-2 flex flex-wrap gap-2">
                {effectiveRoles.map((role, idx) => (
                  <Badge
                    key={role}
                    className={ROLE_BADGE_COLORS[role] ?? 'bg-gray-100 text-gray-700'}
                    variant="secondary"
                  >
                    {idx === 0 && <Shield className="mr-1 h-3 w-3" />}
                    {role}
                    {idx === 0 && effectiveRoles.length > 1 && ' (Primary)'}
                  </Badge>
                ))}
                <Badge className={getStatusBadge(user.isActive)} variant="secondary">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {user.emailVerified && (
                  <Badge className="bg-blue-100 text-blue-700" variant="secondary">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-sm">
                <Shield className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Roles:</span>
                <span className="font-medium">{effectiveRoles.join(', ')}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">
                  {new Date((user as any).createdAt).toLocaleDateString()}
                </span>
              </div>

              {user.lastLogin && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Login:</span>
                  <span className="font-medium">
                    {new Date(user.lastLogin).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Current account standing and verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Status</span>
                <Badge className={getStatusBadge(user.isActive)} variant="secondary">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {user.isActive
                  ? 'User can log in and access the system'
                  : 'User account is disabled'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Verification</span>
                <Badge
                  className={
                    user.emailVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }
                  variant="secondary"
                >
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {user.emailVerified
                  ? 'Email address has been verified'
                  : 'Email address needs verification'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User ID</span>
                <code className="rounded bg-muted px-2 py-1 text-xs">{user.id}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance QR Code */}
      <div className="flex gap-6 items-start">
        <UserQRCode
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
          userRole={user.role}
          isAdmin={currentUser?.roles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r)) ?? ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role ?? '')}
        />
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Info</CardTitle>
              <CardDescription>This QR code is used for scanning attendance at QR scanner devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Each user has a unique, permanent QR code tied to their account.</p>
              <p>• The QR is valid at any active scanner the user's role is allowed on.</p>
              <p>• Admins can regenerate the QR if it is lost or compromised.</p>
              <p>• GPS geofencing is enforced by the scanner device, not the QR code itself.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role & Permissions — combined for all assigned roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles &amp; Permissions</CardTitle>
          <CardDescription>
            Combined access rights based on{' '}
            {effectiveRoles.length === 1
              ? effectiveRoles[0]
              : `${effectiveRoles.length} assigned roles`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Individual role chips with their labels */}
          {effectiveRoles.length > 1 && (
            <div className="flex flex-wrap gap-2 pb-2 border-b">
              {effectiveRoles.map((role, idx) => (
                <div
                  key={role}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${ROLE_BADGE_COLORS[role] ?? 'bg-gray-100 text-gray-700'
                    }`}
                >
                  <Shield className="h-3 w-3" />
                  {ROLE_PERMISSIONS[role]?.label ?? role}
                  {idx === 0 && (
                    <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
                      primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Combined permissions list */}
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {uniquePermissions.map((perm, idx) => (
              <li key={idx}>{perm}</li>
            ))}
            {uniquePermissions.length === 0 && (
              <li className="list-none text-sm text-muted-foreground">No permissions found.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
