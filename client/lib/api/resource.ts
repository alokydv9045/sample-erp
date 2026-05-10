import apiClient from './client';

export const libraryAPI = {
  getBooks: async (params?: any) => {
    const { data } = await apiClient.get('/library/books', { params });
    return data;
  },

  getBook: async (id: string) => {
    const { data } = await apiClient.get(`/library/books/${id}`);
    return data;
  },

  createBook: async (bookData: any) => {
    const { data } = await apiClient.post('/library/books', bookData);
    return data;
  },

  updateBook: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/library/books/${id}`, updates);
    return data;
  },

  issueBook: async (issueData: any) => {
    const { data } = await apiClient.post('/library/issue', issueData);
    return data;
  },

  returnBook: async (returnData: { issueId: string; conditionOnReturn?: string; remarks?: string }) => {
    const { data } = await apiClient.post('/library/return', returnData);
    return data;
  },

  renewBook: async (renewData: { issueId: string; newDueDate?: string }) => {
    const { data } = await apiClient.post('/library/renew', renewData);
    return data;
  },

  reserveBook: async (reserveData: any) => {
    const { data } = await apiClient.post('/library/reserve', reserveData);
    return data;
  },

  getReservations: async (params?: any) => {
    const { data } = await apiClient.get('/library/reservations', { params });
    return data;
  },

  getIssues: async (params?: any) => {
    const { data } = await apiClient.get('/library/issues', { params });
    return data;
  },

  getOverdue: async () => {
    const { data } = await apiClient.get('/library/overdue');
    return data;
  },
};

export const inventoryAPI = {
  getItems: async (params?: any) => {
    const { data } = await apiClient.get('/inventory/items', { params });
    return data;
  },

  getItem: async (id: string) => {
    const { data } = await apiClient.get(`/inventory/items/${id}`);
    return data;
  },

  createItem: async (itemData: any) => {
    const { data } = await apiClient.post('/inventory/items', itemData);
    return data;
  },

  updateItem: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/inventory/items/${id}`, updates);
    return data;
  },

  recordMovement: async (movementData: any) => {
    const { data } = await apiClient.post('/inventory/movements', movementData);
    return data;
  },

  getMovements: async (params?: any) => {
    const { data } = await apiClient.get('/inventory/movements', { params });
    return data;
  },

  getLowStock: async () => {
    const { data } = await apiClient.get('/inventory/low-stock');
    return data;
  },

  getSummary: async () => {
    const { data } = await apiClient.get('/inventory/summary');
    return data;
  },
};
