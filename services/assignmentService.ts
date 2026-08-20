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
  },

  getByDriverId: async (driverId: string) => {
    return await fetchApi(`/api/assignments/driver/${driverId}`);
  },

  // Promote the next queued trip for a driver (marks current active as completed)
  promoteNextTrip: async (driverId: string) => {
    return await fetchApi(`/api/assignments/driver/${driverId}/promote-next`, {
      method: 'POST',
    });
  },

  // Mark truck as inspected — driver becomes available again
  markTruckInspected: async (driverId: string, inspectionData?: {
    bookingId?: string;
    vehicleCondition: string;
    // Every tyre inspected, each with its own condition. The flat pair below is
    // still accepted for older callers; the server derives it from this list.
    tyres?: { number: string; condition: string }[];
    tyreCondition?: string;
    tyreNumber?: string;
    challans?: string;
    deliveryOrders?: string[];
    damages?: { quantity: string; amount: string }[];
    notes?: string;
    attachments?: { name: string; url: string; size: number; type: string }[];
    // Damages/DO for earlier trips auto-completed while returning (never inspected)
    pastTrips?: {
      bookingId: string;
      deliveryOrders?: string[];
      damages?: { quantity: string; amount: string }[];
    }[];
  }) => {
    return await fetchApi(`/api/assignments/driver/${driverId}/mark-inspected`, {
      method: 'PATCH',
      body: JSON.stringify(inspectionData || {}),
    });
  },

  // Earlier trips for this TRUCK that were auto-completed while returning and
  // still have no damages/DO recorded
  getPendingInspections: async (truckNumber: string) => {
    return await fetchApi(`/api/assignments/truck/${encodeURIComponent(truckNumber)}/pending-inspections`);
  },

  // Get drivers currently returning or under inspection
  getReturningDrivers: async () => {
    return await fetchApi('/api/assignments/returning-drivers');
  }
};
