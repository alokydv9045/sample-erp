import apiClient from './client';

export const attendanceAPI = {
  mark: async (attendanceData: any) => {
    const { data } = await apiClient.post('/attendance/mark', attendanceData);
    return data;
  },

  rfidScan: async (cardNumber: string, deviceId: string) => {
    const { data } = await apiClient.post('/attendance/rfid-scan', { cardNumber, deviceId });
    return data;
  },

  bulkMark: async (bulkData: any) => {
    const { data } = await apiClient.post('/attendance/bulk', bulkData);
    return data;
  },

  qrScan: async (payload: any) => {
    const { data } = await apiClient.post('/attendance/qr-scan', payload);
    return data;
  },

  getRecords: async (params?: any) => {
    const { data } = await apiClient.get('/attendance/date', { params });
    return data;
  },

  getClassReport: async (params: any) => {
    const { data } = await apiClient.get('/attendance/report', { params });
    return data;
  },

  // Slot-based attendance
  createSlot: async (slotData: any) => {
    const { data } = await apiClient.post('/attendance/slots', slotData);
    return data;
  },

  getSlots: async (params?: any) => {
    const { data } = await apiClient.get('/attendance/slots', { params });
    return data;
  },

  getSlot: async (id: string) => {
    const { data } = await apiClient.get(`/attendance/slots/${id}`);
    return data;
  },

  deleteSlot: async (id: string) => {
    const { data } = await apiClient.delete(`/attendance/slots/${id}`);
    return data;
  },

  submitSlotAttendance: async (id: string, attendanceData: any[]) => {
    const { data } = await apiClient.post(`/attendance/slots/${id}/submit`, { attendanceData });
    return data;
  },

  submitStaffAttendance: async (attendanceData: { date: string, attendanceData: any[], attendeeType: 'TEACHER' | 'STAFF' }) => {
    const { data } = await apiClient.post('/attendance/staff-batch', attendanceData);
    return data;
  },

  getAnalytics: async (params?: {
    classId?: string;
    sectionId?: string;
    startDate?: string;
    endDate?: string;
    attendeeType?: string;
  }) => {
    const { data } = await apiClient.get('/attendance/analytics', { params });
    return data;
  },
  getMyAttendance: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await apiClient.get('/attendance/my', { params });
    return data;
  },
};
