import { fetchApi } from "./api";

export interface WarehouseConfig {
  street: string;
  city: string;
  province: string;
  country: string;
}

export const warehouseService = {
  get: (): Promise<WarehouseConfig> => fetchApi("/api/warehouse"),
  save: (data: WarehouseConfig): Promise<WarehouseConfig> =>
    fetchApi("/api/warehouse", { method: "POST", body: JSON.stringify(data) }),
};
