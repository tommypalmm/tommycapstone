import { query } from "./db";
import { googleBusy, type Interval } from "./calendar";
import { addDaysYmd, weekdayOfYmd, ymdInTz, zonedToUtc, type WeeklyHours } from "./time";
import type { Account, Service, Staff } from "./types";

export const SELF_SERVE_MIN_LEAD_MS = 24 * 3600_000; // Decision #7: no self-serve bookings < 24h out
export const BOOKING_HORIZON_DAYS = 60;

/** What's still missing before the booking page may accept bookings (Decision #17). */
export function goLiveIssues(account: Account, services: Service[]): string[] {
  const issues: string[] = [];
  if (account.status !== "active") issues.push("This account is closed.");
  if (!account.operating_hours || Object.keys(account.operating_hours).length === 0) issues.push("Set your operating hours.");
  if (!account.booking_interval_min || account.booking_interval_min <= 0) issues.push("Set your booking interval.");
  const ready = services.filter((s) => s.active && s.duration_min > 0);
  if (ready.length === 0) issues.push("Add at least one service with a duration.");
  return issues;
}

function hoursFor(staff: Staff, account: Account): WeeklyHours {
  return staff.working_hours ?? account.operating_hours ?? {};
}

function bufferFor(staff: Staff, account: Account): number {
  return (staff.buffer_minutes ?? account.buffer_minutes ?? 0) * 60_000;
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

interface DayContext {
  staff: Staff[];
  bookings: Map<string, Interval[]>;
  busy: Map<string, Interval[]>;
}

async function loadDay(account: Account, ymd: string, staffFilter?: string): Promise<DayContext> {
  const staff = (
    await query<Staff>("SELECT * FROM staff WHERE account_id = $1 AND active ORDER BY role = 'owner' DESC, created_at", [
      account.id,
    ])
  ).filter((s) => !staffFilter || s.id === staffFilter);
  const from = zonedToUtc(ymd, "00:00", account.timezone);
  const to = zonedToUtc(addDaysYmd(ymd, 1), "00:00", account.timezone);
  const ids = staff.map((s) => s.id);
  const rows = await query<{ staff_id: string; start_time: Date; end_time: Date }>(
    `SELECT staff_id, start_time, end_time FROM bookings
     WHERE staff_id = ANY($1) AND status <> 'cancelled' AND start_time < $3 AND end_time > $2`,
    [ids, new Date(from.getTime() - 86400_000), new Date(to.getTime() + 86400_000)],
  );
  const bookings = new Map<string, Interval[]>();
  for (const r of rows) {
    const list = bookings.get(r.staff_id) ?? [];
    list.push({ start: new Date(r.start_time).getTime(), end: new Date(r.end_time).getTime() });
    bookings.set(r.staff_id, list);
  }
  const busy = await googleBusy(ids, from, to);
  return { staff, bookings, busy };
}

function staffFree(ctx: DayContext, staff: Staff, account: Account, slot: Interval): boolean {
  const buf = bufferFor(staff, account);
  const padded = { start: slot.start - buf, end: slot.end + buf };
  if ((ctx.bookings.get(staff.id) ?? []).some((b) => overlaps(padded, b))) return false;
  if ((ctx.busy.get(staff.id) ?? []).some((b) => overlaps(slot, b))) return false;
  return true;
}

export interface Slot {
  start: Date;
  staffIds: string[];
}

/** Open start times for a service on a given local date. A slot that conflicts with anything is simply omitted. */
export async function availableSlots(
  account: Account,
  service: Service,
  ymd: string,
  opts: { selfServe: boolean; staffId?: string },
): Promise<Slot[]> {
  const interval = account.booking_interval_min;
  if (!interval || interval <= 0) return [];
  const ctx = await loadDay(account, ymd, opts.staffId);
  const earliest = Date.now() + (opts.selfServe ? SELF_SERVE_MIN_LEAD_MS : 0);
  const weekday = String(weekdayOfYmd(ymd));
  const durationMs = service.duration_min * 60_000;
  const byStart = new Map<number, string[]>();

  for (const s of ctx.staff) {
    const window = hoursFor(s, account)[weekday];
    if (!window) continue;
    const open = zonedToUtc(ymd, window[0], account.timezone).getTime();
    const close = zonedToUtc(ymd, window[1], account.timezone).getTime();
    for (let t = open; t + durationMs <= close; t += interval * 60_000) {
      if (t < earliest) continue;
      if (!staffFree(ctx, s, account, { start: t, end: t + durationMs })) continue;
      byStart.set(t, [...(byStart.get(t) ?? []), s.id]);
    }
  }
  return [...byStart.entries()].sort((a, b) => a[0] - b[0]).map(([t, staffIds]) => ({ start: new Date(t), staffIds }));
}

/**
 * Owner/staff-entered bookings may be at any time (outside the slot grid, or
 * inside 24h), but still must not collide with another booking or a calendar event.
 */
export async function staffIsFree(account: Account, staff: Staff, start: Date, end: Date): Promise<boolean> {
  const ctx = await loadDay(account, ymdInTz(start, account.timezone), staff.id);
  return staffFree(ctx, staff, account, { start: start.getTime(), end: end.getTime() });
}

/** Re-checks a specific start time at confirm time; returns the staff ids that can take it. */
export async function freeStaffAt(
  account: Account,
  service: Service,
  ymd: string,
  start: Date,
  opts: { selfServe: boolean; staffId?: string },
): Promise<string[]> {
  const slots = await availableSlots(account, service, ymd, opts);
  return slots.find((s) => s.start.getTime() === start.getTime())?.staffIds ?? [];
}
