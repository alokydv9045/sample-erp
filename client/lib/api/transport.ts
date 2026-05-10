import apiClient from './client';

export const transportAPI = {
  // VEHICLES
  getVehicles: async (params?: any) => {
    const { data } = await apiClient.get('/transport/vehicles', { params });
    return data;
  },
  createVehicle: async (vehicleData: any) => {
    const { data } = await apiClient.post('/transport/vehicles', vehicleData);
    return data;
  },
  updateVehicle: async (id: string, vehicleData: any) => {
    const { data } = await apiClient.put(`/transport/vehicles/${id}`, vehicleData);
    return data;
  },
  deleteVehicle: async (id: string) => {
    const { data } = await apiClient.delete(`/transport/vehicles/${id}`);
    return data;
  },

  // ROUTES & STOPS
  getRoutes: async (params?: any) => {
    const { data } = await apiClient.get('/transport/routes', { params });
    return data;
  },
  createRoute: async (routeData: any) => {
    const { data } = await apiClient.post('/transport/routes', routeData);
    return data;
  },
  updateRoute: async (id: string, routeData: any) => {
    const { data } = await apiClient.put(`/transport/routes/${id}`, routeData);
    return data;
  },

  // DRIVERS
  getDrivers: async () => {
    const { data } = await apiClient.get('/transport/drivers');
    return data;
  },

  // ALLOCATIONS
  getAllocations: async (params?: any) => {
    const { data } = await apiClient.get('/transport/allocations', { params });
    return data;
  },
  assignStudent: async (allocationData: any) => {
    const { data } = await apiClient.post('/transport/allocations', allocationData);
    return data;
  },
  removeAssignment: async (studentId: string) => {
    const { data } = await apiClient.delete(`/transport/allocations/${studentId}`);
    return data;
  },

  // DASHBOARD
  getStats: async () => {
    const { data } = await apiClient.get('/transport/dashboard/stats');
    return data;
  },

  // STUDENT/PARENT VIEW
  getMyTransport: async () => {
    const { data } = await apiClient.get('/transport/my-transport');
    return data;
  }
};
