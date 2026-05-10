import apiClient from './client';

export const paymentAPI = {
  createOrder: async (ledgerId: string, amount: number) => {
    const { data } = await apiClient.post('/payments/create-order', { ledgerId, amount });
    return data;
  },

  verifyPayment: async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    ledgerId: string;
  }) => {
    const { data } = await apiClient.post('/payments/verify', payload);
    return data;
  },

  getMyPaymentHistory: async () => {
    const { data } = await apiClient.get('/payments/my-history');
    return data;
  },
};
