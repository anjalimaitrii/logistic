export interface LiveVehicle {
  Vehicle_Name: string;
  Vehicle_No: string;
  Company: string;
  Branch: string;
  Latitude: string;
  Longitude: string;
  Speed: string;
  Status: string;        // RUNNING | IDLE | INACTIVE | STOP
  IGN: string;           // ON | OFF
  GPS: string;           // ON | OFF
  Angle: string;
  Datetime: string;
  GPSActualTime: string;
  Odometer: string;
  Battery_percentage: string;
  ExternalVolt: string;
  Power: string;
  Location: string;
  Driver_First_Name: string;
  Driver_Middle_Name: string;
  Driver_Last_Name: string;
  DeviceModel: string;
  Vehicletype: string;
  Imeino: string;        // actual field name from API
  AC: string;
  Temperature: string;
  SOS: string;
  POI: string;
  Fuel: unknown[];
  satellite_count?: number;
  Altitude?: string;
}

export type VehicleStatusType = 'moving' | 'stopped' | 'parked' | 'inactive';

export function getVehicleStatus(v: LiveVehicle): VehicleStatusType {
  const lat = parseFloat(v.Latitude);
  const lng = parseFloat(v.Longitude);
  if (isNaN(lat) || isNaN(lng) || v.GPS === 'OFF' || v.Status === 'INACTIVE') {
    return 'inactive';
  }
  if (v.IGN === 'OFF') return 'parked';
  // Status field: "RUNNING" = moving, "IDLE" = engine on but speed 0
  const speed = parseFloat(v.Speed) || 0;
  if (v.Status === 'RUNNING' || speed > 0) return 'moving';
  return 'stopped';
}

export function hasValidCoords(v: LiveVehicle): boolean {
  const lat = parseFloat(v.Latitude);
  const lng = parseFloat(v.Longitude);
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
}

export function getDriverName(v: LiveVehicle): string {
  const parts = [v.Driver_First_Name, v.Driver_Middle_Name, v.Driver_Last_Name]
    .filter((s) => s && s !== '--' && String(s).trim().toLowerCase() !== 'null');
  return parts.length > 0 ? parts.join(' ') : 'No Driver';
}

/** Strips literal "null" tokens & extra spaces from stored driver names */
export function cleanDriverName(name?: string): string {
  return (name || '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Unknown Driver';
}

export async function fetchLiveVehicles(): Promise<LiveVehicle[]> {
  const res = await fetch(`/api/livetrack`, { cache: 'default' });
  if (!res.ok) throw new Error('Failed to fetch live tracking data');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Unknown error');
  return data.vehicles ?? [];
}
