import { fetchApi } from './api';

export interface LocationStop {
  contactPerson: string;
  contactNumber: string;
  contactPerson2?: string;
  contactNumber2?: string;
  address: {
    plotNo: string;
    street: string;
    city: string;
    lga?: string;
    pincode?: string;
  };
  gpsEnabled?: boolean;
  sequence: number;
}

export interface BookingPayload {
  clientId?: string;
  cargoDetails: {
    goodsType: string;
    weight: number;
    loadingDate: string;
  };
  pickupLocations: LocationStop[];
  dropoffLocations: LocationStop[];
  requirement: {
    bodyType: string;
  };
  status?: string;
  tripStatus?: string;
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
  
  updateTripStatus: async (id: string, tripStatus: string) => {
    return await fetchApi(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ tripStatus }),
    });
  },

  update: async (id: string, payload: any) => {
    return await fetchApi(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  changeAddress: async (id: string, newPickup: any, newDropoff: any, reason: string, financials?: { newPickupKm: number; newDropoffKm: number; newFinalAmount: number }) => {
    return await fetchApi(`/api/bookings/${id}/address`, {
      method: 'PATCH',
      body: JSON.stringify({ newPickup, newDropoff, reason, financials }),
    });
  }
};
