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
    } catch (error: any) {
      // Only "no settlement yet" is a null. Everything else — notably the 409
      // raised when an empty leg is unattributed — must reach the caller.
      if (error?.status === 404) return null;
      throw error;
    }
  }
};
