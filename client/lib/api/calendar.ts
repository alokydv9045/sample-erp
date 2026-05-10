import api from './client';

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    date: string;
    type: 'HOLIDAY' | 'EVENT' | 'EXAM' | 'EMERGENCY' | 'NOTICE';
    category: 'ACADEMIC' | 'CULTURAL' | 'SPORTS' | 'HOLIDAY' | 'ADMINISTRATIVE' | 'MEETING';
    audience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'STAFF';
    isFullDay: boolean;
    startTime?: string;
    endTime?: string;
    location?: string;
    isWorkingDay: boolean;
    createdById: string;
    createdBy?: {
        firstName: string;
        lastName: string;
        role: string;
    };
}

export const calendarApi = {
    getEvents: async (startDate?: string, endDate?: string) => {
        const { data } = await api.get<{ success: boolean; events: CalendarEvent[] }>(`/calendar`, { params: { startDate, endDate } });
        return data;
    },
    
    getUpcomingEvents: async (limit: number = 5) => {
        const { data } = await api.get<{ success: boolean; events: CalendarEvent[] }>(`/calendar/upcoming`, { params: { limit } });
        return data;
    },
    
    createEvent: async (data: Partial<CalendarEvent>) => {
        const { resData } = await api.post<{ success: boolean; event: CalendarEvent }>(`/calendar`, data).then(r => ({ resData: r.data }));
        return resData;
    },
    
    updateEvent: async (id: string, data: Partial<CalendarEvent>) => {
        const { resData } = await api.patch<{ success: boolean; event: CalendarEvent }>(`/calendar/${id}`, data).then(r => ({ resData: r.data }));
        return resData;
    },
    
    deleteEvent: async (id: string) => {
        const { resData } = await api.delete<{ success: boolean; message: string }>(`/calendar/${id}`).then(r => ({ resData: r.data }));
        return resData;
    },
};
