import { fetchApi } from './api';

export interface TruckPayload {
  truckId: string;
  vehicleModel: string;
  capacity?: number;
  year?: string;
  fuelType?: string;
  health?: string;
  truckType?: string;
  length?: number;
  width?: number;
  height?: number;
  maintenanceDate?: string;
  status?: string;
  odometer?: string;
  
  // Compliance & Technical Fields
  complianceDocs?: {
    type: string;
    dueDate: string;
    file?: string;
  }[];
  fastagBalance?: string;
  tireNumbers?: string;
  nextServiceKm?: string;
  estNextServiceDate?: string;
  maintenanceFareCost?: string;
  currentService?: string;
  nextService?: string;
  nextServiceDate?: string;
  tireSerialNumber?: string | string[];
}

export const truckService = {
  create: async (payload: TruckPayload) => {
    return await fetchApi('/api/trucks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAll: async () => {
    return await fetchApi('/api/trucks');
  },

  getById: async (id: string) => {
    return await fetchApi(`/api/trucks/${id}`);
  },

  update: async (id: string, payload: Partial<TruckPayload>) => {
    return await fetchApi(`/api/trucks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string) => {
    return await fetchApi(`/api/trucks/${id}`, {
      method: 'DELETE',
    });
  },

  addCollection: async (truckId: string, payload: { name: string; description: string; quantity: number }) => {
    return await fetchApi(`/api/trucks/${truckId}/collections`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  removeCollection: async (truckId: string, colId: string) => {
    return await fetchApi(`/api/trucks/${truckId}/collections/${colId}`, {
      method: 'DELETE',
    });
  },

  renewCollection: async (truckId: string, colId: string, quantity?: number) => {
    return await fetchApi(`/api/trucks/${truckId}/collections/${colId}/renew`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },
};
