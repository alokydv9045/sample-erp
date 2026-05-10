import client from './client';

export const notificationAPI = {
    getNotifications: async () => {
        const response = await client.get('/notifications');
        return response.data;
    },
    markAsRead: async (id: string) => {
        const response = await client.put(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await client.put('/notifications/mark-all-read');
        return response.data;
    }
};
