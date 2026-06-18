import { NextResponse } from "next/server";

const REPORT_BASE = "http://43.204.86.252/ReportServices";
const USER_API_CONFIG_ID = "429";
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CREDS = {
  username: process.env.TRAKZEE_USERNAME || "speedogisticzm@tntzm.gps",
  password: process.env.TRAKZEE_PASSWORD || "Krishna@1985",
};

// Token cache (25 min — the short-lived auth_token expires in ~30 min)
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${REPORT_BASE}/config/usertoken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDS),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  if (!data.auth_token) throw new Error("auth_token not found in response");

  cachedToken = data.auth_token;
  tokenExpiry = Date.now() + 25 * 60 * 1000;
  return cachedToken!;
}

async function getImeiForTruck(truckNumber: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_API}/api/livetrack`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const vehicles: any[] = data.vehicles ?? [];
    const normalized = truckNumber.trim().toUpperCase();
    const match = vehicles.find(
      (v) =>
        String(v.Vehicle_No || "").trim().toUpperCase() === normalized ||
        String(v.Vehicle_Name || "").trim().toUpperCase() === normalized
    );
    return match?.Imeino ? String(match.Imeino) : null;
  } catch {
    return null;
  }
}

const APP_TZ = "Africa/Lusaka"; // Zambia / CAT — the vehicles' timezone

// Format a date to "DD-MM-YYYY HH:MM:SS" in Zambia time (CAT), matching
// the timezone Trakzee logs vehicle events in. `endOfDay` forces 23:59:59.
function toApiDate(raw: string, endOfDay = false): string {
  try {
    let d: Date;
    const ddmm = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (ddmm) {
      d = new Date(`${ddmm[3]}-${ddmm[2].padStart(2, "0")}-${ddmm[1].padStart(2, "0")}`);
    } else {
      d = new Date(raw);
    }
    if (isNaN(d.getTime())) throw new Error("invalid date");

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: APP_TZ,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value || "00";
    const datePart = `${get("day")}-${get("month")}-${get("year")}`;

    const hasTime = raw.includes("T") || raw.includes(" ");
    const time = endOfDay ? "23:59:59" : hasTime ? `${get("hour")}:${get("minute")}:${get("second")}` : "00:00:00";
    return `${datePart} ${time}`;
  } catch {
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const g = (t: string) => now.find(p => p.type === t)?.value || "00";
    return `${g("day")}-${g("month")}-${g("year")} ${endOfDay ? "23:59:59" : "00:00:00"}`;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const truck = url.searchParams.get("truck");
  const from  = url.searchParams.get("from");   // loadingDate
  const to    = url.searchParams.get("to");     // end date (updatedAt or today)

  if (!truck || !from) {
    return NextResponse.json(
      { success: false, error: "truck and from are required" },
      { status: 400 }
    );
  }

  try {
    // 1. Get IMEI
    const imei = await getImeiForTruck(truck);
    if (!imei) {
      return NextResponse.json(
        { success: false, error: `No IMEI found for truck: ${truck}` },
        { status: 404 }
      );
    }

    // 2. Auth token
    const token = await getToken();

    // 3. Date range — start = trip start moment, end = actual "to" (now, or trip end).
    //    Use the real end time (NOT end-of-day) so an in-progress trip's window is
    //    start → now, not start → 23:59 (which would inflate the durations).
    const startDt = toApiDate(from, false);
    const endDt   = toApiDate(to || new Date().toISOString(), false);
    console.log("[trip-stats] truck:", truck, "imei:", imei, "range:", startDt, "→", endDt);

    // 4. Call travelsummaryreport
    const res = await fetch(
      `${REPORT_BASE}/customapi/travelsummaryreport?user_api_config_id=${USER_API_CONFIG_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          start_date_time: startDt,
          end_date_time: endDt,
          imei_nos: imei,
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      cachedToken = null;
      tokenExpiry = 0;
      throw new Error(`Trakzee API error: ${res.status}`);
    }

    const data = await res.json();
    console.log("[trip-stats] RAW Trakzee response:", JSON.stringify(data).slice(0, 800));

    if (data.status === "fail") {
      // Rate limit or other error — return empty but don't crash
      return NextResponse.json({
        success: false,
        error: data.message || "Trakzee API returned fail",
        data: null,
      });
    }

    const row = Array.isArray(data.data) ? data.data[0] : null;
    if (!row) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        vehicle:          row.vehicle_information ?? truck,
        driver:           row.driver_name ?? "--",
        runningDuration:  row.running_duration ?? "--",
        idleDuration:     row.idle_duration ?? "--",
        stopDuration:     row.stop_duration ?? "--",
        inactiveDuration: row.inactive_duration ?? "--",
        totalDuration:    row.total_duration ?? "--",
        runningKm:        row.running_km ?? 0,
        maxSpeed:         row.max_speed ?? 0,
        avgSpeed:         row.avg_spped ?? 0,
        workDuration:     row.work_duration ?? "--",
        workingDays:      row.working_days ?? "--",
        startLocation:    row.start_location ?? "--",
        endLocation:      row.end_location ?? "--",
        startOdometer:    row.start_odometer ?? 0,
        endOdometer:      row.end_odometer ?? 0,
        idleCount:        row.Idle_no ?? 0,
        dateRange:        { from: startDt, to: endDt },
      },
    });
  } catch (err: any) {
    console.error("[trip-stats]", err.message);
    return NextResponse.json(
      { success: false, error: err.message, data: null },
      { status: 500 }
    );
  }
}
