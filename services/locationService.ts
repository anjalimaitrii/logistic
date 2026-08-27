import { fetchApi } from './api';

export type LocationKind = 'country' | 'state' | 'city';

export interface CustomLocation {
  _id: string;
  kind: LocationKind;
  name: string;
  country?: string;
  state?: string;
}

/**
 * Countries, provinces and towns operators added because the shipped list in
 * lib/africaLocations did not have them. Always read alongside that list — this
 * holds the additions only.
 */
export const locationService = {
  getAll: async (): Promise<CustomLocation[]> => {
    return await fetchApi('/api/locations');
  },
  create: async (body: { kind: LocationKind; name: string; country?: string; state?: string }) => {
    return await fetchApi('/api/locations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  remove: async (id: string) => {
    return await fetchApi(`/api/locations/${id}`, { method: 'DELETE' });
  },
};
