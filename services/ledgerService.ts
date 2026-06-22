import { fetchApi } from './api';

// includeSecret = true → secret-portal ledger (complete picture: regular + secret
// trips). Omitted / false → normal client ledger (secret jobs hidden).
export const ledgerService = {
  getCompany: (companyId: string, includeSecret = false) =>
    fetchApi(`/api/ledger/company/${companyId}${includeSecret ? '?includeSecret=1' : ''}`),

  getClient: (clientId: string, includeSecret = false) =>
    fetchApi(`/api/ledger/client/${clientId}${includeSecret ? '?includeSecret=1' : ''}`),

  addCompanyPayment: (companyId: string, payload: { amount: number; note?: string; paidAt?: string; includeSecret?: boolean }) =>
    fetchApi(`/api/ledger/company/${companyId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addClientPayment: (clientId: string, payload: { amount: number; note?: string; paidAt?: string; includeSecret?: boolean }) =>
    fetchApi(`/api/ledger/client/${clientId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deletePayment: (paymentId: string, password: string) =>
    fetchApi(`/api/ledger/payment/${paymentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),
};
