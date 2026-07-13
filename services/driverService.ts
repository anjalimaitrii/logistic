import { fetchApi } from './api';

export interface DriverPayload {
  name: string;
  phone: string;
  licenseType: string;
  licenseNo: string;
  experience: number;
  assignedTruck?: string; // MongoDB _id
  status?: string;
}

export interface DriverCredentialsPayload {
  email: string;
  password: string;
}

export const driverService = {
  create: async (payload: DriverPayload) => {
    return await fetchApi('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  registerCredentials: async (id: string, payload: DriverCredentialsPayload) => {
    return await fetchApi(`/api/drivers/${id}/credentials`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getAll: async () => {
    return await fetchApi('/api/drivers');
  },

  getById: async (id: string) => {
    return await fetchApi(`/api/drivers/${id}`);
  },

  update: async (id: string, payload: Partial<DriverPayload>) => {
    return await fetchApi(`/api/drivers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string) => {
    return await fetchApi(`/api/drivers/${id}`, {
      method: 'DELETE',
    });
  },
};
