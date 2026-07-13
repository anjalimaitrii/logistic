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

  // Multipart upload — bypasses fetchApi because it forces a JSON Content-Type
  uploadSheet: async (file: File) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/toll/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Upload failed: ${res.status}`);
    }
    return res.json();
  },

  getEntries: async (status?: 'matched' | 'unmatched') => {
    return await fetchApi(`/api/toll/entries${status ? `?status=${status}` : ''}`);
  },

  getForBooking: async (bookingId: string) => {
    return await fetchApi(`/api/toll/booking/${bookingId}`);
  },
};
