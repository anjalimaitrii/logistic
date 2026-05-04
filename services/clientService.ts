import { fetchApi } from './api';

export interface ClientPayload {
  name: string;
  email: string;
  contact: string;
  designation: string;
  password?: string;
  company?: string;
  status: string;
}

export const clientService = {
  getAll: async (companyId?: string) => {
    const url = companyId ? `/api/clients?companyId=${companyId}` : '/api/clients';
    return await fetchApi(url);
  },

  create: async (payload: ClientPayload) => {
    return await fetchApi('/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: any) => {
    return await fetchApi('/api/clients/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getById: async (id: string) => {
    return await fetchApi(`/api/clients/${id}`);
  },

  update: async (id: string, payload: Partial<ClientPayload>) => {
    return await fetchApi(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string) => {
    return await fetchApi(`/api/clients/${id}`, {
      method: 'DELETE',
    });
  },
  
  updatePassword: async (id: string, newPassword: string) => {
    return await fetchApi(`/api/clients/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  }
};
