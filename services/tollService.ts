import { fetchApi } from './api';

export const tollService = {
  getAccount: async () => {
    return await fetchApi('/api/toll');
  },

  addRecharge: async (amount: number, description?: string) => {
    return await fetchApi('/api/toll/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  },
};
