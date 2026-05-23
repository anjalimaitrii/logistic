import { fetchApi } from './api';

export const truckInspectionService = {
  getAll: async () => {
    return await fetchApi('/api/truck-inspections');
  },

  getByTruck: async (truckId: string) => {
    return await fetchApi(`/api/truck-inspections/truck/${truckId}`);
  },

  getByDriver: async (driverId: string) => {
    return await fetchApi(`/api/truck-inspections/driver/${driverId}`);
  }
};
