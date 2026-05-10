import client from './client';

export const timetableAPI = {
  getConfig: async (classId: string) => {
    const { data } = await client.get(`/timetables/config?classId=${classId}`);
    return data;
  },
  updateConfig: async (classId: string, configData: any) => {
    const { data } = await client.put(`/timetables/config/${classId}`, configData);
    return data;
  },
  generateBaseline: async (timetableId: string | null, configId: string, classId?: string) => {
    const { data } = await client.post(`/timetables/generate-baseline${timetableId ? `/${timetableId}` : ''}`, { configId, classId });
    return data;
  },
  updateSlot: async (slotId: string, data: any) => {
    const { data: resData } = await client.patch(`/timetables/slots/${slotId}`, data);
    return resData;
  },
  getTeacherSchedule: async (teacherId: string) => {
    const { data } = await client.get(`/timetables/teacher/${teacherId}`);
    return data;
  },
  getStudentSchedule: async (sectionId: string) => {
    const { data } = await client.get(`/timetables/student/${sectionId}`);
    return data;
  },
  getRooms: async () => {
    const { data } = await client.get('/timetables/rooms');
    return data;
  },
  createRoom: async (roomData: any) => {
    const { data } = await client.post('/timetables/rooms', roomData);
    return data;
  },
};
