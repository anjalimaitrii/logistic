export interface TravelSummaryRecord {
  vehicle_name?: string;
  vehicle_no?: string;
  imei_no?: string;
  driver_name?: string;
  running_km?: string | number;
  running_duration?: string;
  stop_duration?: string;
  max_speed?: string | number;
  start_location?: string;
  end_location?: string;
  start_date_time?: string;
  end_date_time?: string;
  [key: string]: unknown;
}

export async function fetchTravelSummary(
  start_date_time: string,
  end_date_time: string,
  imei_nos: string
): Promise<TravelSummaryRecord[]> {
  const res = await fetch(`/api/travel-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ start_date_time, end_date_time, imei_nos }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch travel summary");
  return json.data ?? [];
}
