'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { userAPI, User } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2, Eye, Users as UsersIcon, Info, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

// Extended User type with relationships
interface UserWithRelationships extends User {
  relationships?: Array<{
    type: 'HAS_PARENT' | 'HAS_STUDENT';
    count: number;
    details: any[];
  }>;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithRelationships[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await userAPI.getAll({ role: selectedRole || undefined });

      if (data && data.users) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      // If backend doesn't have /users endpoint yet, show empty state
      if (err.response?.status === 404) {
        setUsers([]);
        setError('User management endpoint not found. Please check backend configuration.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view users. Please login as an Admin.');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch users');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const handleToggleStatus = async (user: UserWithRelationships) => {
    try {
      setActionLoading(user.id);
      await userAPI.update(user.id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700',
      TEACHER: 'bg-blue-100 text-blue-700',
      STUDENT: 'bg-green-100 text-green-700',
      PARENT: 'bg-orange-100 text-orange-700',
      ACCOUNTANT: 'bg-yellow-100 text-yellow-700',
      LIBRARIAN: 'bg-pink-100 text-pink-700',
      INVENTORY_MANAGER: 'bg-indigo-100 text-indigo-700',
      ADMISSION_MANAGER: 'bg-teal-100 text-teal-700',
    };
    return variants[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Register and manage system users</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Register User
          </Link>
        </Button>
      </div>

      {/* Info Card for Student-Parent Credential Sharing */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Student-Parent Single Identity System
              </p>
              <p className="text-xs text-blue-800">
                <strong>Parents do NOT have separate login accounts.</strong> When a student has linked parent records,
                the student's email/password automatically grants access to both STUDENT and PARENT features.
                The system detects parent relationships and adds PARENT role during login. This is indicated by the
                "Shared Login" badge in the Relationships column below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            Manage all user accounts and their roles ({filteredUsers.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="LIBRARIAN">Librarian</option>
              <option value="INVENTORY_MANAGER">Inventory Manager</option>
              <option value="ADMISSION_MANAGER">Admission Manager</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
              <p className="font-semibold">Note:</p>
              <p>{typeof error === "string" ? error : JSON.stringify(error)}</p>
              <p className="mt-2">
                Click "Register User" button above to add new users to the system.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Get started by registering your first user'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Relationships</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role: string, index: number) => (
                              <Badge key={index} className={getRoleBadge(role)} variant="secondary">
                                {role}
                                {role === user.role && ' (Primary)'}
                              </Badge>
                            ))
                          ) : (
                            <Badge className={getRoleBadge(user.role)} variant="secondary">
                              {user.role}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.relationships && user.relationships.length > 0 ? (
                          <div className="space-y-1">
                            {user.relationships.map((rel, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-xs">
                                <UsersIcon className="h-3 w-3" />
                                <span className="font-medium">
                                  {rel.count} Parent{rel.count > 1 ? 's' : ''}:
                                </span>
                                <span className="text-muted-foreground">
                                  Linked
                                </span>
                                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                                  Shared Login
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(user.isActive)} variant="secondary">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={user.isActive ? "Deactivate User" : "Activate User"}
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading === user.id}
                            className={user.isActive ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/users/${user.id}`}>
                              <Eye className="h-4 w-4" />
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
