import { fetchApi } from "./api";

export interface MileageConfig {
  loadedMileage: number;
  unloadedMileage: number;
}

export const mileageService = {
  get: (): Promise<MileageConfig> => fetchApi("/api/mileage"),
  save: (data: MileageConfig): Promise<MileageConfig> =>
    fetchApi("/api/mileage", { method: "POST", body: JSON.stringify(data) }),
};
