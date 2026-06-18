import { fetchApi } from './api';

export const ledgerService = {
  getCompany: (companyId: string) =>
    fetchApi(`/api/ledger/company/${companyId}`),

  getClient: (clientId: string) =>
    fetchApi(`/api/ledger/client/${clientId}`),

  addCompanyPayment: (companyId: string, payload: { amount: number; note?: string; paidAt?: string }) =>
    fetchApi(`/api/ledger/company/${companyId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addClientPayment: (clientId: string, payload: { amount: number; note?: string; paidAt?: string }) =>
    fetchApi(`/api/ledger/client/${clientId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deletePayment: (paymentId: string) =>
    fetchApi(`/api/ledger/payment/${paymentId}`, { method: 'DELETE' }),
};
