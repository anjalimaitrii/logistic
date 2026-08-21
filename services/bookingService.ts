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
  };
  gpsEnabled?: boolean;
  sequence: number;
}

export interface BookingPayload {
  clientId?: string;
  cargoDetails: {
    goodsType: string[];
    weight?: number;
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
  /**
   * Mark the truck as returning to the yard AND record how far it will run empty.
   * One call, because the status on its own left the run costed at nothing.
   */
  markReturning: async (
    bookingId: string,
    // The yard is not sent: the server takes it from Route Master, so a return can
    // never be recorded to a place that is not the warehouse. The three amounts are
    // what this run adds on top of what the trip already carries.
    body: { km: number; addAllocation?: number; addCouncilLevy?: number; addToll?: number }
  ) =>
    fetchApi(`/api/bookings/${bookingId}/returning`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

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

  // Cancel = permanently delete the booking (and its assignment/settlement)
  cancel: async (id: string) => {
    return await fetchApi(`/api/bookings/${id}`, { method: 'DELETE' });
  },

  updateStatus: async (id: string, status: string, additionalData: any = {}) => {
    return await fetchApi(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...additionalData }),
    });
  },
  
  updateTripStatus: async (id: string, tripStatus: string, extra: Record<string, any> = {}) => {
    return await fetchApi(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ tripStatus, ...extra }),
    });
  },

  // Cache the latest Trakzee GPS stats so the page can show them instantly on reload
  saveTripStats: async (id: string, tripStats: any) => {
    return await fetchApi(`/api/bookings/${id}/trip-stats`, {
      method: 'PATCH',
      body: JSON.stringify({ tripStats }),
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
