import { fetchApi } from './api';

export interface BookingPayload {
  clientId?: string;
  cargoDetails: {
    goodsType: string;
    weight: number;
    loadingDate: string;
  };
  pickup: {
    contactPerson: string;
    contactNumber: string;
    address: {
      plotNo: string;
      street: string;
      city: string;
      pincode: string;
    };
    gpsEnabled: boolean;
  };
  dropoff: {
    contactPerson: string;
    contactNumber: string;
    address: {
      plotNo: string;
      street: string;
      city: string;
      pincode: string;
    };
    gpsEnabled: boolean;
  };
  requirement: {
    bodyType: string;
  };
  status?: string;
  metadata?: {
    source: string;
    createdAt: string;
  };
}

export const bookingService = {
  create: async (payload: BookingPayload) => {
    return await fetchApi('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAll: async (clientId?: string) => {
    const url = clientId ? `/api/bookings?clientId=${clientId}` : '/api/bookings';
    return await fetchApi(url);
  },

  getById: async (id: string) => {
    return await fetchApi(`/api/bookings/${id}`);
  },

  updateStatus: async (id: string, status: string, additionalData: any = {}) => {
    return await fetchApi(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...additionalData }),
    });
  },

  update: async (id: string, payload: any) => {
    return await fetchApi(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
};
