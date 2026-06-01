import { NextResponse } from 'next/server';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(req: Request) {
  try {
    // Proxy to backend API with caching + fallback
    const res = await fetch(`${BACKEND_API}/api/livetrack`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Backend request failed: ${res.status}`);
    }

    const data = await res.json();

    // Copy cache headers from backend
    const cacheHeader = res.headers.get('Cache-Control');
    const cacheStatus = res.headers.get('X-Cache');

    const response = NextResponse.json(data);
    if (cacheHeader) response.headers.set('Cache-Control', cacheHeader);
    if (cacheStatus) response.headers.set('X-Cache', cacheStatus);

    return response;
  } catch (error: any) {
    console.error('[LiveTrack Proxy]', error.message);
    return NextResponse.json(
      { success: false, error: error.message, vehicles: [] },
      { status: 500 }
    );
  }
}
