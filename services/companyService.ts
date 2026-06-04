import { fetchApi } from './api';

export interface CompanyPayload {
  companyName: string;
  cinNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
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
      cinNumber, 
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
        cinNumber,
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

  delete: async (id: string) => {
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
