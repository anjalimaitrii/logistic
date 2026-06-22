import { fetchApi } from './api';

// Completed trips filed with a new id: with-tax → invoices (inv-001…),
// without-tax → cash (cash-001…).
export const completionService = {
  getInvoices: () => fetchApi('/api/invoices'),
  getCash: () => fetchApi('/api/cash'),
};
