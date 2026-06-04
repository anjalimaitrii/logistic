import { fetchApi } from "./api";

export interface RouteEntry {
  _id?: string;
  pickupCity: string;
  pickupProvince: string;
  pickupCountry: string;
  dropoffCity: string;
  dropoffProvince: string;
  dropoffCountry: string;
  distance: number;
  tollCount: number;
  tollAmount: number;
  allocationMoney: number;
  councilLevy: number;
}

export const routeService = {
  getAll: (): Promise<RouteEntry[]> => fetchApi("/api/routes"),

  create: (data: Omit<RouteEntry, "_id">): Promise<RouteEntry> =>
    fetchApi("/api/routes", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<RouteEntry>): Promise<RouteEntry> =>
    fetchApi(`/api/routes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: string): Promise<void> =>
    fetchApi(`/api/routes/${id}`, { method: "DELETE" }),

  findMatch: (pickup: string, dropoff: string): Promise<RouteEntry | null> =>
    fetchApi(`/api/routes/match?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(dropoff)}`).catch(() => null),
};
