import { fetchApi } from './api';

export const settlementService = {
  process: async (data: any) => {
    return await fetchApi('/api/settlements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return await fetchApi('/api/settlements');
  },

  getByBookingId: async (bookingId: string) => {
    try {
      return await fetchApi(`/api/settlements/booking/${bookingId}`);
    } catch {
      return null;
    }
  }
};
