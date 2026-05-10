'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { transportAPI } from '@/lib/api/transport';
import { Loader2, Bus, Map, Users, Settings, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import VehiclesTable from '@/components/dashboard/transport/VehiclesTable';
import RoutesTable from '@/components/dashboard/transport/RoutesTable';
import AllocationsTable from '@/components/dashboard/transport/AllocationsTable';

export default function TransportDashboard() {
  const { isStudent, isParent, canManageTransport } = usePermissions();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // For Student/Parent View
  const [myTransport, setMyTransport] = useState<any>(null);

  useEffect(() => {
    if (canManageTransport) {
      fetchStats();
    } else if (isStudent || isParent) {
      fetchMyTransport();
    } else {
        setLoading(false); // Teacher or other roles
    }
  }, [canManageTransport, isStudent, isParent]);

  const fetchStats = async () => {
    try {
      const res = await transportAPI.getStats();
      setStats(res.stats);
    } catch (error) {
      console.error('Failed to load stats', error);
      toast.error('Failed to load transport statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTransport = async () => {
    try {
      const res = await transportAPI.getMyTransport();
      setMyTransport(res.allocation);
    } catch (error) {
      console.error('Failed to load transport details', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Student / Parent Read-Only View
  if (isStudent || isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Transport</h2>
          <p className="text-muted-foreground">View your assigned transport details and schedule.</p>
        </div>

        {!myTransport ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <Bus className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-lg font-medium text-muted-foreground">No Transport Assigned</p>
              <p className="text-sm text-muted-foreground mt-1">You are not currently allocated to any school transport route.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" /> Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Route Name</p>
                  <p className="text-lg font-semibold">{myTransport.route?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pickup/Drop Stop</p>
                  <p className="text-lg font-semibold">{myTransport.stop?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Arrival Time</p>
                  <Badge variant="outline" className="mt-1 text-base">{myTransport.stop?.arrivalTime}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Admin / Transport Manager View
  if (!canManageTransport) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view the transport dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transport Management</h2>
          <p className="text-muted-foreground">Manage vehicles, routes, drivers, and student allocations.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
          <TabsTrigger value="overview" className="py-2.5 px-4"><Bus className="w-4 h-4 mr-2"/> Overview</TabsTrigger>
          <TabsTrigger value="vehicles" className="py-2.5 px-4"><Settings className="w-4 h-4 mr-2"/> Vehicles</TabsTrigger>
          <TabsTrigger value="routes" className="py-2.5 px-4"><Map className="w-4 h-4 mr-2"/> Routes & Stops</TabsTrigger>
          <TabsTrigger value="allocations" className="py-2.5 px-4"><Users className="w-4 h-4 mr-2"/> Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalVehicles || 0}</div>
                <p className="text-xs text-muted-foreground">Active in fleet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
                <Map className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeRoutes || 0}</div>
                <p className="text-xs text-muted-foreground">Mapped paths</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students Transported</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.studentsUsingTransport || 0}</div>
                <p className="text-xs text-muted-foreground">Currently assigned</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.vehiclesUnderMaintenance || 0}</div>
                <p className="text-xs text-muted-foreground">Vehicles out of service</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardContent className="pt-6">
               <VehiclesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardContent className="pt-6">
               <RoutesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardContent className="pt-6">
               <AllocationsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
