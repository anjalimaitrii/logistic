import { NextResponse } from 'next/server';

const REPORT_BASE = 'http://43.204.86.252/ReportServices';
const USER_API_CONFIG_ID = '429';
const CREDS = {
  username: process.env.TRAKZEE_USERNAME || 'speedogisticzm@tntzm.gps',
  password: process.env.TRAKZEE_PASSWORD || 'Krishna@1985',
};

// auth_token expires in ~30 min — cache 25 min
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(force = false): Promise<string> {
  if (!force && cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${REPORT_BASE}/config/usertoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDS),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);

  const data = await res.json();
  const token = data?.auth_token ?? null;

  if (!token) {
    console.error('[TravelSummary] Unexpected token response:', JSON.stringify(data));
    throw new Error('auth_token not found in response');
  }

  cachedToken = token;
  tokenExpiry = Date.now() + 25 * 60 * 1000;
  return token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { start_date_time, end_date_time, imei_nos } = body;

    if (!start_date_time || !end_date_time || !imei_nos) {
      return NextResponse.json(
        { success: false, error: 'start_date_time, end_date_time, imei_nos are required' },
        { status: 400 }
      );
    }

    let token = await getToken();

    let res = await fetch(
      `${REPORT_BASE}/customapi/travelsummaryreport?user_api_config_id=${USER_API_CONFIG_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ start_date_time, end_date_time, imei_nos }),
        cache: 'no-store',
      }
    );

    // Token expired mid-session — refresh once and retry
    if (!res.ok) {
      token = await getToken(true);
      res = await fetch(
        `${REPORT_BASE}/customapi/travelsummaryreport?user_api_config_id=${USER_API_CONFIG_ID}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({ start_date_time, end_date_time, imei_nos }),
          cache: 'no-store',
        }
      );
    }

    if (!res.ok) throw new Error(`Trakzee API error: ${res.status}`);

    const data = await res.json();

    if (data?.status === 'fail') {
      return NextResponse.json({ success: false, error: data.message || 'Trakzee API returned fail', data: [] }, { status: 429 });
    }

    const rows: Record<string, any>[] = data?.data ?? [];

    const records = rows.map((item) => ({
      vehicle_name: item.vehicle_information ?? '--',
      vehicle_no:   item.vehicle_information ?? '--',
      imei_no:      String(item.imei_no ?? ''),
      driver_name:  item.driver_name ?? '--',
      running_km:       item.running_km,
      running_duration: item.running_duration,
      stop_duration:    item.stop_duration,
      idle_duration:    item.idle_duration,
      max_speed:        item.max_speed,
      avg_speed:        item.avg_spped,
      start_location:   item.start_location,
      end_location:     item.end_location,
      working_days:     item.working_days,
      work_duration:    item.work_duration,
      start_odometer:   item.start_odometer,
      end_odometer:     item.end_odometer,
    }));

    return NextResponse.json({ success: true, data: records });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TravelSummary]', message);
    return NextResponse.json({ success: false, error: message, data: [] }, { status: 500 });
  }
}
