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

  /** What deleting this client would detach — read before confirming. */
  usage: async (id: string): Promise<{
    clientName: string; bookings: number; invoices: number;
    payments: number; cash: number; total: number; summary: string;
  }> => {
    return await fetchApi(`/api/clients/${id}/usage`);
  },

  remove: async (id: string) => {
    return await fetchApi(`/api/clients/${id}`, { method: 'DELETE' });
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

  // Admin login — verified server-side against ADMIN_EMAIL / ADMIN_PASSWORD env vars
  adminLogin: async (payload: { identifier: string; password: string }) => {
    return await fetchApi('/api/clients/admin-login', {
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
  },

  forgotPassword: async (email: string) => {
    return await fetchApi('/api/clients/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOTP: async (email: string, otp: string) => {
    return await fetchApi('/api/clients/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return await fetchApi('/api/clients/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};
