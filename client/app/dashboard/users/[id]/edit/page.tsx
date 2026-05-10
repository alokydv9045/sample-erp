'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { userAPI, studentAPI, teacherAPI, academicAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Available roles for editing (not STUDENT — students have dedicated registration)
const ROLE_CONFIG = [
    {
        value: 'ADMIN',
        label: 'Admin',
        description: 'Full system access and management capabilities',
    },
    {
        value: 'TEACHER',
        label: 'Teacher',
        description: 'Manage classes, attendance, grades, and student records',
    },
    {
        value: 'ACCOUNTANT',
        label: 'Accountant',
        description: 'Manage fees, payments, and financial records',
    },
    {
        value: 'LIBRARIAN',
        label: 'Librarian',
        description: 'Manage library books and issue records',
    },
    {
        value: 'HR_MANAGER',
        label: 'HR Manager',
        description: 'Manage employees, salaries, and payroll processing',
    },
    {
        value: 'TRANSPORT_MANAGER',
        label: 'Transport Manager',
        description: 'Manage transport vehicles, routes, drivers, and student assignments',
    },
];

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [formData, setFormData] = useState<any>({
        firstName: '',
        lastName: '',
        phone: '',
        isActive: true,
    });

    // Multi-role state
    const [selectedRoles, setSelectedRoles] = useState<string[]>(['TEACHER']);
    const isStudentUser = user?.role === 'STUDENT';

    // Role specific states
    const [studentData, setStudentData] = useState<any>({
        rollNumber: '',
        currentClassId: '',
        status: 'ACTIVE',
    });

    const [teacherData, setTeacherData] = useState<any>({
        qualification: '',
        experience: '',
        specialization: '',
    });

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [userData, classData] = await Promise.all([
                userAPI.getById(id),
                academicAPI.getClasses(),
            ]);

            setUser(userData);
            setClasses(classData.classes || []);

            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                phone: userData.phone || '',
                isActive: userData.isActive,
            });

            // Initialise selected roles from user.roles, fall back to [user.role]
            const existingRoles =
                userData.roles && userData.roles.length > 0 ? userData.roles : [userData.role];
            setSelectedRoles(existingRoles);

            if (userData.role === 'STUDENT' && userData.student) {
                setStudentData({
                    rollNumber: userData.student.rollNumber || '',
                    currentClassId: userData.student.currentClassId || '',
                    status: userData.student.status || 'ACTIVE',
                });
            }

            if (userData.role === 'TEACHER' && userData.teacher) {
                setTeacherData({
                    qualification: userData.teacher.qualification || '',
                    experience: userData.teacher.experience || '',
                    specialization: userData.teacher.specialization || '',
                });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch details');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRole = (roleValue: string) => {
        setSelectedRoles((prev) => {
            if (prev.includes(roleValue)) {
                if (prev.length === 1) return prev; // keep at least one
                return prev.filter((r) => r !== roleValue);
            }
            return [...prev, roleValue];
        });
    };

    const primaryRole = isStudentUser ? 'STUDENT' : selectedRoles[0];

    const handleSave = async () => {
        if (!isStudentUser && selectedRoles.length === 0) {
            setError('Please select at least one role.');
            return;
        }

        try {
            setIsSaving(true);
            setError('');

            // 1. Update base user — include multi-role data
            await userAPI.update(id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                role: primaryRole,
                roles: isStudentUser ? ['STUDENT'] : selectedRoles,
                isActive: formData.isActive,
            });

            // 2. Update student specifics
            if (user.role === 'STUDENT' && user.student) {
                await studentAPI.update(user.student.id, studentData);
            }

            // 3. Update teacher specifics
            if (user.role === 'TEACHER' && user.teacher) {
                await teacherAPI.update(user.teacher.id, {
                    qualification: teacherData.qualification,
                    experience: teacherData.experience ? parseInt(teacherData.experience) : null,
                    specialization: teacherData.specialization,
                });
            }

            toast.success('User updated successfully');
            router.push(`/dashboard/users/${id}`);
            router.refresh();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !user) {
        return <div className="p-4 text-red-500 bg-red-100 rounded-md">{typeof error === "string" ? error : JSON.stringify(error)}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/users/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to User Profile
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit User: {user.firstName} {user.lastName}</CardTitle>
                    <CardDescription>Update basic information and role-specific details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">{typeof error === "string" ? error : JSON.stringify(error)}</div>
                    )}

                    {/* Core Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 flex flex-col justify-end pb-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Account is Active</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Role Assignment — only for non-student users */}
                    {!isStudentUser ? (
                        <div className="space-y-4 pt-4 border-t">
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
                                Select one or more roles. The first selected role is the primary role. At least one
                                role must remain selected.
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
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleRole(roleItem.value)}
                                                disabled={isSaving}
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
                        </div>
                    ) : (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                <strong>Note:</strong> Student accounts can only have the STUDENT role. Role changes
                                are not available here.
                            </p>
                        </div>
                    )}

                    {/* Student Specific */}
                    {user.role === 'STUDENT' && user.student && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold">Student Details</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Roll Number</Label>
                                    <Input
                                        value={studentData.rollNumber}
                                        onChange={(e) =>
                                            setStudentData({ ...studentData, rollNumber: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Class</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={studentData.currentClassId}
                                        onChange={(e) =>
                                            setStudentData({ ...studentData, currentClassId: e.target.value })
                                        }
                                    >
                                        <option value="">Select a Class</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Teacher Specific */}
                    {user.role === 'TEACHER' && user.teacher && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold">Teacher Details</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Qualification</Label>
                                    <Input
                                        value={teacherData.qualification}
                                        onChange={(e) =>
                                            setTeacherData({ ...teacherData, qualification: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Years of Experience</Label>
                                    <Input
                                        type="number"
                                        value={teacherData.experience}
                                        onChange={(e) =>
                                            setTeacherData({ ...teacherData, experience: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Specialization</Label>
                                    <Input
                                        value={teacherData.specialization}
                                        onChange={(e) =>
                                            setTeacherData({ ...teacherData, specialization: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6">
                        <Button variant="outline" onClick={() => router.push(`/dashboard/users/${id}`)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || (!isStudentUser && selectedRoles.length === 0)}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
