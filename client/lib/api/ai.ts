import apiClient from './client';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
}

export interface InitResponse {
  success: boolean;
  greeting: string;
  user: {
    firstName: string;
    role: string;
  };
}

export const aiAPI = {
  initChat: async (): Promise<InitResponse> => {
    const { data } = await apiClient.post('/ai/init');
    return data;
  },

  sendMessage: async (message: string, history: { role: string; content: string }[]): Promise<ChatResponse> => {
    const { data } = await apiClient.post('/ai/chat', { message, history });
    return data;
  },

  generateSmartAssignment: async (params: any): Promise<any> => {
    const { data } = await apiClient.post('/ai/generate-smart-assignment', params);
    return data;
  },
};
