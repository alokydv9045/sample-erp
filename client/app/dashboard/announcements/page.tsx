'use client';

import { useEffect, useState, useCallback } from 'react';
import { announcementAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Bell, Calendar, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSocket } from '@/hooks/useSocket';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const { isStudent } = usePermissions();

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    expiryDate: '',
  });

  const fetchActiveAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await announcementAPI.getActive();
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await announcementAPI.getAll();
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (isStudent) {
      fetchActiveAnnouncements();
    } else {
      fetchAnnouncements();
    }
  }, [isStudent, fetchActiveAnnouncements, fetchAnnouncements]);

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        if (isStudent) fetchActiveAnnouncements();
        else fetchAnnouncements();
      };

      socket.on('ANNOUNCEMENT_CREATED', handleUpdate);
      socket.on('ANNOUNCEMENT_UPDATED', handleUpdate);
      socket.on('ANNOUNCEMENT_DELETED', handleUpdate);

      return () => {
        socket.off('ANNOUNCEMENT_CREATED', handleUpdate);
        socket.off('ANNOUNCEMENT_UPDATED', handleUpdate);
        socket.off('ANNOUNCEMENT_DELETED', handleUpdate);
      };
    }
  }, [socket, isStudent, fetchActiveAnnouncements, fetchAnnouncements]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementAPI.create(announcementForm);
      setIsDialogOpen(false);
      setAnnouncementForm({
        title: '',
        content: '',
        priority: 'MEDIUM',
        targetAudience: 'ALL',
        expiryDate: '',
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await announcementAPI.delete(id);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-orange-100 text-orange-700',
      NORMAL: 'bg-orange-100 text-orange-700',
      LOW: 'bg-blue-100 text-blue-700',
    };
    return variants[priority] || 'bg-gray-100 text-gray-700';
  };

  const getAudienceBadge = (audience: string) => {
    const variants: Record<string, string> = {
      ALL: 'bg-purple-100 text-purple-700',
      STUDENTS: 'bg-blue-100 text-blue-700',
      TEACHERS: 'bg-green-100 text-green-700',
      PARENTS: 'bg-orange-100 text-orange-700',
    };
    return variants[audience] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isStudent ? 'Notices & Announcements' : 'Announcements'}
          </h1>
          <p className="text-muted-foreground">
            {isStudent ? 'Stay updated with the latest school news.' : 'Create and manage school-wide announcements'}
          </p>
        </div>
        {!isStudent && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>Post an announcement to all users or specific groups</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <textarea
                    id="content"
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter announcement details"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <select
                      id="priority"
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience *</Label>
                    <select
                      id="targetAudience"
                      value={announcementForm.targetAudience}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, targetAudience: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="ALL">All Users</option>
                      <option value="STUDENTS">Students Only</option>
                      <option value="TEACHERS">Teachers Only</option>
                      <option value="PARENTS">Parents Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={announcementForm.expiryDate}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, expiryDate: e.target.value })}
                  />
                </div>

                <Button type="submit">Publish Announcement</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isStudent && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                <p className="text-sm font-medium text-muted-foreground">Total Announcements</p>
                <p className="text-3xl font-bold">{announcements.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-green-600" />
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {announcements.filter(a => a.isActive).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-red-600" />
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-3xl font-bold text-red-600">
                  {announcements.filter(a => a.priority === 'HIGH').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No announcements</p>
              <p className="text-sm text-muted-foreground">
                Create your first announcement to notify users
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.priority === 'HIGH' ? 'border-red-200' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      <Badge className={getPriorityBadge(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                      <Badge className={getAudienceBadge(
                        Array.isArray(announcement.targetAudience)
                          ? (announcement.targetAudience.length > 0 ? announcement.targetAudience[0] : 'ALL')
                          : announcement.targetAudience
                      )} variant="secondary">
                        {Array.isArray(announcement.targetAudience)
                          ? (announcement.targetAudience.length > 0 ? announcement.targetAudience.join(', ') : 'ALL')
                          : announcement.targetAudience}
                      </Badge>
                      {announcement.isActive && (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </div>
                      {announcement.expiryDate && (
                        <div className="flex items-center gap-1">
                          <span>Expires:</span>
                          {new Date(announcement.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isStudent && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
