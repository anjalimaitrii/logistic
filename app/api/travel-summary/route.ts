import { NextResponse } from 'next/server';

const WEBSERVICE_BASE = process.env.TRAKZEE_BASE_URL || 'http://13.127.228.11/webservice';
const CREDENTIALS = {
  username: process.env.TRAKZEE_USERNAME || '',
  password: process.env.TRAKZEE_PASSWORD || '',
};

// Token cache (22h TTL)
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${WEBSERVICE_BASE}?token=generateAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);

  const data = await res.json();
  const token =
    (Array.isArray(data) ? data[0]?.token : undefined) ??
    data?.data?.[0]?.token ??
    data?.data?.token ??
    data?.token ??
    null;

  if (!token) {
    console.error('[TravelSummary] Token response:', JSON.stringify(data));
    throw new Error('Token not found in response');
  }

  cachedToken = token;
  tokenExpiry = Date.now() + 22 * 60 * 60 * 1000;
  return token;
}

// Debug endpoints:
// GET /api/travel-summary?debug=token  → raw token response
// GET /api/travel-summary?debug=data   → tries travel summary with test params, shows raw response
export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get('debug');

  if (debug === 'token') {
    const res = await fetch(`${WEBSERVICE_BASE}?token=generateAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS),
      cache: 'no-store',
    });
    const raw = await res.text();
    return NextResponse.json({ status: res.status, raw });
  }

  if (debug === 'data') {
    try {
      const authToken = await getToken();
      const candidates = [
        // From Reports > Activity menu
        'viewTravel', 'getTravelReport', 'viewTravelReport',
        'viewTrip', 'getTripReport', 'viewTripReport',
        'viewStoppage', 'getStoppageReport', 'viewStoppageReport',
        'viewIdle', 'getIdleReport', 'viewIdleReport',
        'viewDaywiseDistance', 'getDaywiseDistance', 'getDaywiseDistanceReport',
        'viewOverspeedSummary', 'getOverspeedSummary',
        'viewObjectStatus', 'getObjectStatus',
        'viewTodayActivity', 'getTodayActivity',
        'viewLiveMatrix', 'getLiveMatrix',
        // Previous attempts
        'viewTravelSummary', 'viewTravelSummaryReport',
        'viewDaySummaryReport', 'getDaySummaryReport',
      ];
      const results: Record<string, unknown> = {};
      for (const name of candidates) {
        const res = await fetch(`${WEBSERVICE_BASE}?token=${name}&ProjectId=37`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'auth-code': authToken },
          body: JSON.stringify({
            start_date_time: '01-05-2025 00:00:00',
            end_date_time: '01-05-2025 23:59:59',
            imei_nos: '',
          }),
          cache: 'no-store',
        });
        const raw = await res.text();
        results[name] = { status: res.status, snippet: raw.slice(0, 120) };
      }
      return NextResponse.json(results);
    } catch (e: unknown) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ error: 'Use POST or ?debug=token or ?debug=data' }, { status: 405 });
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

    const token = await getToken();

    const res = await fetch(
      `${WEBSERVICE_BASE}?token=getDaySummaryReport&ProjectId=37`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-code': token,
        },
        body: JSON.stringify({ start_date_time, end_date_time, imei_nos }),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      cachedToken = null;
      tokenExpiry = 0;
      throw new Error(`Travel summary request failed: ${res.status} — raw: ${await res.text()}`);
    }

    const data = await res.json();
    console.log('[TravelSummary] raw response:', JSON.stringify(data).slice(0, 500));

    // Handle both response shapes
    const rows: Record<string, unknown>[] =
      data?.data ?? data?.root?.TravelSummaryData ?? data?.TravelSummaryData ?? [];

    const records = rows.map((item) => ({
      vehicle_name: item.Vehicle_Name ?? item.vehicle_information ?? '--',
      vehicle_no: item.Vehicle_No ?? item.vehicle_information ?? '--',
      imei_no: String(item.Imeino ?? item.imei_no ?? ''),
      driver_name: item.Driver_Name ?? item.driver_name ?? '--',
      running_km: item.Running_Km ?? item.running_km,
      running_duration: item.Running_Duration ?? item.running_duration,
      stop_duration: item.Stop_Duration ?? item.stop_duration,
      max_speed: item.Max_Speed ?? item.max_speed,
      start_location: item.Start_Location ?? item.start_location,
      end_location: item.End_Location ?? item.end_location,
      branch: item.Branch ?? item.branch,
      company: item.Company ?? item.company,
      idle_duration: item.Idle_Duration ?? item.idle_duration,
      total_duration: item.Total_Duration ?? item.total_duration,
      avg_speed: item.Avg_Speed ?? item.avg_spped,
      working_days: item.Working_Days ?? item.working_days,
    }));

    return NextResponse.json({ success: true, data: records });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TravelSummary]', message);
    return NextResponse.json(
      { success: false, error: message, data: [] },
      { status: 500 }
    );
  }
}
