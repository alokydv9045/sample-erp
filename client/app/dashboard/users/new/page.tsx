'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Available roles for general user registration (not STUDENT—they have a dedicated flow)
const ROLE_CONFIG = [
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Full system access and management capabilities',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    value: 'TEACHER',
    label: 'Teacher',
    description: 'Manage classes, attendance, grades, and student records',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    value: 'ACCOUNTANT',
    label: 'Accountant',
    description: 'Manage fees, payments, and financial records',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  {
    value: 'LIBRARIAN',
    label: 'Librarian',
    description: 'Manage library books and issue records',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  {
    value: 'HR_MANAGER',
    label: 'HR Manager',
    description: 'Manage employees, salaries, and payroll processing',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  {
    value: 'ADMISSION_MANAGER',
    label: 'Admission Manager',
    description: 'Register new students and manage all admission-related data entry',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  },
  {
    value: 'NOTIFICATION_MANAGER',
    label: 'Notification Manager',
    description: 'Manage WhatsApp notifications, templates, bulk messaging, and delivery logs',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  {
    value: 'TRANSPORT_MANAGER',
    label: 'Transport Manager',
    description: 'Manage transport vehicles, routes, drivers, and student assignments',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
];

export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['TEACHER']);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleRole = (roleValue: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleValue)) {
        // Don't allow deselecting the last role
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== roleValue);
      }
      return [...prev, roleValue];
    });
  };

  // Primary role = first selected role
  const primaryRole = selectedRoles[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRoles.length === 0) {
      setError('Please select at least one role.');
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: primaryRole as any,
        roles: selectedRoles as any,
        phone: formData.phone || undefined,
      };

      await userAPI.register(userData);

      toast.success('User registered successfully');
      router.push('/dashboard/users');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to register user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register New User</CardTitle>
          <CardDescription>
            Create a new user account. Multiple roles can be assigned — the first selected role is
            the primary role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Role Assignment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Role Assignment</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedRoles.map((role, idx) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {idx === 0 && <Shield className="mr-1 h-3 w-3" />}
                      {role}
                      {idx === 0 && ' (Primary)'}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Select one or more roles. The first selected role becomes the primary role.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_CONFIG.map((roleItem) => {
                  const isChecked = selectedRoles.includes(roleItem.value);
                  const isPrimary = selectedRoles[0] === roleItem.value;
                  return (
                    <label
                      key={roleItem.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${isChecked
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40'
                        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRole(roleItem.value)}
                        disabled={isLoading}
                        className="mt-1 h-4 w-4 rounded accent-primary"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{roleItem.label}</span>
                          {isPrimary && isChecked && (
                            <Badge className="text-[10px] px-1 py-0 bg-primary text-primary-foreground">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{roleItem.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Students are registered separately via the Students module.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Account Security</h3>
              <div className="max-w-sm space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || selectedRoles.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register User'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
