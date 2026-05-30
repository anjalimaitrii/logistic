import { NextResponse } from 'next/server';

const TRAKZEE_BASE = 'http://13.127.228.11/webservice';
const CREDENTIALS = {
  username: 'speedogisticzm@tntzm.gps',
  password: 'Krishna@1985',
};

// Use global to survive Next.js dev-mode hot reloads
const g = global as any;
if (!g.__livetrackToken)  g.__livetrackToken  = null;
if (!g.__livetrackExpiry) g.__livetrackExpiry = 0;

async function getToken(): Promise<string> {
  if (g.__livetrackToken && Date.now() < g.__livetrackExpiry) return g.__livetrackToken;

  const res = await fetch(`${TRAKZEE_BASE}?token=generateAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);

  const data = await res.json();

  // Try all known response shapes from this API:
  //   [{"token":"..."}]                      ← direct array
  //   {"data":[{"token":"..."}]}             ← wrapped in data array
  //   {"result":1,"data":{"token":"..."}}    ← wrapped in data object
  //   {"token":"..."}                        ← token at root
  const token =
    (Array.isArray(data) ? data[0]?.token : undefined) ??
    data?.data?.[0]?.token ??
    data?.data?.token ??
    data?.token ??
    null;

  if (!token) {
    console.error('[LiveTrack] Token response:', JSON.stringify(data));
    throw new Error('Token not found in response');
  }

  g.__livetrackToken  = token;
  g.__livetrackExpiry = Date.now() + 22 * 60 * 60 * 1000;
  return token;
}

// Debug: call /api/livetrack?debug=token to see raw token response
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('debug') === 'token') {
    const res = await fetch(`${TRAKZEE_BASE}?token=generateAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS),
      cache: 'no-store',
    });
    const raw = await res.text();
    return NextResponse.json({ status: res.status, raw });
  }

  try {
    const token = await getToken();

    const res = await fetch(`${TRAKZEE_BASE}?token=getTokenBaseLiveData&ProjectId=37`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-code': token,
      },
      body: JSON.stringify({ format: 'json' }),
      cache: 'no-store',
    });

    if (!res.ok) {
      g.__livetrackToken  = null;
      g.__livetrackExpiry = 0;
      throw new Error(`Live data request failed: ${res.status}`);
    }

    const data = await res.json();
    // API returns: { root: { VehicleData: [...] } }  or  { VehicleData: [...] }
    const vehicles = data?.root?.VehicleData ?? data?.VehicleData ?? [];

    return NextResponse.json({ success: true, vehicles, count: vehicles.length });
  } catch (error: any) {
    console.error('[LiveTrack]', error.message);
    return NextResponse.json(
      { success: false, error: error.message, vehicles: [] },
      { status: 500 }
    );
  }
}
