import { one, query } from "./db";
import { appUrl } from "./format";

// Google Calendar, full read/write (Decisions #3, #16, #18). Busy blocks hide
// slots on the booking page; confirmed bookings are written to the staff
// member's calendar. Staff without a connection are scheduled from their
// hours and existing bookings only.

const SCOPE = "https://www.googleapis.com/auth/calendar";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri() {
  return `${appUrl()}/api/google/callback`;
}

export function googleAuthUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...params,
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok) throw new Error(data.error_description ?? data.error ?? `Google token HTTP ${res.status}`);
  return data;
}

export async function connectGoogle(staffId: string, code: string) {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri() });
  await query(
    `INSERT INTO calendar_connections (staff_id, access_token, refresh_token, expires_at, sync_state, last_error)
     VALUES ($1, $2, $3, $4, 'ok', NULL)
     ON CONFLICT (staff_id) DO UPDATE SET access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, calendar_connections.refresh_token),
       expires_at = EXCLUDED.expires_at, sync_state = 'ok', last_error = NULL`,
    [staffId, t.access_token, t.refresh_token ?? null, new Date(Date.now() + t.expires_in * 1000)],
  );
}

interface Connection {
  id: string;
  staff_id: string;
  external_calendar_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: Date | null;
}

async function accessToken(conn: Connection): Promise<string> {
  if (conn.access_token && conn.expires_at && new Date(conn.expires_at).getTime() > Date.now() + 60_000) {
    return conn.access_token;
  }
  if (!conn.refresh_token) throw new Error("Calendar connection expired. Reconnect Google Calendar.");
  const t = await tokenRequest({ refresh_token: conn.refresh_token, grant_type: "refresh_token" });
  await query("UPDATE calendar_connections SET access_token = $1, expires_at = $2 WHERE id = $3", [
    t.access_token,
    new Date(Date.now() + t.expires_in * 1000),
    conn.id,
  ]);
  return t.access_token;
}

async function markError(conn: Connection, e: unknown) {
  await query("UPDATE calendar_connections SET sync_state = 'error', last_error = $1 WHERE id = $2", [
    e instanceof Error ? e.message : String(e),
    conn.id,
  ]);
}

export class CalendarUnavailableError extends Error {}

export interface Interval {
  start: number;
  end: number;
}

/**
 * Busy intervals per staff from Google. Throws CalendarUnavailableError if a
 * connected calendar can't be read: we refuse to show slots we can't verify
 * rather than risk a confirmed-but-taken booking.
 */
export async function googleBusy(staffIds: string[], from: Date, to: Date): Promise<Map<string, Interval[]>> {
  const out = new Map<string, Interval[]>();
  if (!googleConfigured() || staffIds.length === 0) return out;
  const conns = await query<Connection>("SELECT * FROM calendar_connections WHERE staff_id = ANY($1)", [staffIds]);
  for (const conn of conns) {
    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: { Authorization: `Bearer ${await accessToken(conn)}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          timeMin: from.toISOString(),
          timeMax: to.toISOString(),
          items: [{ id: conn.external_calendar_id }],
        }),
      });
      if (!res.ok) throw new Error(`Google freeBusy HTTP ${res.status}`);
      const data = (await res.json()) as { calendars: Record<string, { busy: { start: string; end: string }[] }> };
      const busy = data.calendars[conn.external_calendar_id]?.busy ?? [];
      out.set(
        conn.staff_id,
        busy.map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) })),
      );
    } catch (e) {
      await markError(conn, e);
      throw new CalendarUnavailableError("We can't load availability right now. Please try again in a few minutes.");
    }
  }
  return out;
}

/** Writes the booking to the staff member's Google Calendar. Returns the event id, or null if not connected. */
export async function createCalendarEvent(
  staffId: string,
  ev: { summary: string; description: string; start: Date; end: Date; bookingId: string },
): Promise<string | null> {
  if (!googleConfigured()) return null;
  const conn = await one<Connection>("SELECT * FROM calendar_connections WHERE staff_id = $1", [staffId]);
  if (!conn) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.external_calendar_id)}/events`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${await accessToken(conn)}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: ev.summary,
          description: ev.description,
          start: { dateTime: ev.start.toISOString() },
          end: { dateTime: ev.end.toISOString() },
          extendedProperties: { private: { petproBookingId: ev.bookingId } },
        }),
      },
    );
    if (!res.ok) throw new Error(`Google insert event HTTP ${res.status}`);
    const data = (await res.json()) as { id: string };
    return data.id;
  } catch (e) {
    await markError(conn, e);
    return null;
  }
}

export async function deleteCalendarEvent(staffId: string, eventId: string | null) {
  if (!eventId || !googleConfigured()) return;
  const conn = await one<Connection>("SELECT * FROM calendar_connections WHERE staff_id = $1", [staffId]);
  if (!conn) return;
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.external_calendar_id)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${await accessToken(conn)}` } },
    );
    if (!res.ok && res.status !== 404 && res.status !== 410) throw new Error(`Google delete event HTTP ${res.status}`);
  } catch (e) {
    await markError(conn, e);
  }
}
