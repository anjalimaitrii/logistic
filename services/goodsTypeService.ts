import { fetchApi } from './api';

export const goodsTypeService = {
  getAll: async (): Promise<{ _id: string; name: string }[]> => {
    return await fetchApi('/api/goods-types');
  },
  create: async (name: string) => {
    return await fetchApi('/api/goods-types', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  remove: async (id: string) => {
    return await fetchApi(`/api/goods-types/${id}`, { method: 'DELETE' });
  },
};
