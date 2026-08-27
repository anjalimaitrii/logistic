import { fetchApi } from './api';

export interface CompanyPayload {
  companyName: string;
  tpinNumber?: string;
  address: {
    street: string;
    country: string;
    state: string;
    city: string;
  };
  contact?: {
    person: string;
    phone: string;
    email: string;
  };
  accounting: {
    billingName?: string;
    gstNumber?: string;
    paymentTerms?: string;
  };
  status: string;
}

export const companyService = {
  getAll: async () => {
    return await fetchApi('/api/companies');
  },

  create: async (payload: CompanyPayload) => {
    const { 
      companyName, 
      tpinNumber,
      address, 
      contact, 
      accounting, 
      status 
    } = payload;

    if (!companyName) {
      throw new Error("Company name is required");
    }

    return await fetchApi('/api/companies', {
      method: 'POST',
      body: JSON.stringify({
        companyName,
        tpinNumber,
        address,
        contact,
        accounting,
        status,
      }),
    });
  },

  getById: async (id: string) => {
    return await fetchApi(`/api/companies/${id}`);
  },

  update: async (id: string, payload: Partial<CompanyPayload>) => {
    return await fetchApi(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /** What deleting this company would take with it — read before confirming. */
  usage: async (id: string): Promise<{
    companyName: string; clients: number; bookings: number; invoices: number;
    payments: number; cash: number; total: number; summary: string;
  }> => {
    return await fetchApi(`/api/companies/${id}/usage`);
  },

  /** Removes the company AND the client accounts under it. */
  remove: async (id: string) => {
    return await fetchApi(`/api/companies/${id}`, {
      method: 'DELETE',
    });
  },

  assignClients: async (companyId: string, clientIds: string[]) => {
    return await fetchApi(`/api/companies/${companyId}/clients`, {
      method: 'POST',
      body: JSON.stringify({ clientIds }),
    });
  }
};
