import { fetchApi } from './api';

export const assignmentService = {
  create: async (data: any) => {
    return await fetchApi('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return await fetchApi('/api/assignments');
  },

  getByBookingId: async (bookingId: string) => {
    try {
      return await fetchApi(`/api/assignments/booking/${bookingId}`);
    } catch (error: any) {
      if (error.status === 404 || error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  update: async (bookingId: string, data: any) => {
    return await fetchApi(`/api/assignments/booking/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getByTruckId: async (truckId: string) => {
    return await fetchApi(`/api/assignments/truck/${truckId}`);
  }
};
