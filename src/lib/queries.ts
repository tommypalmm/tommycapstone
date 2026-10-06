import { query } from "./db";

export interface BookingListRow {
  id: string;
  start_time: Date;
  end_time: Date;
  status: string;
  source: string;
  price_cents: number;
  client_id: string;
  client_name: string;
  phone_e164: string;
  dog_name: string | null;
  service_name: string;
  staff_name: string;
}

export function listBookings(accountId: string, from: Date, to: Date, opts: { includeCancelled?: boolean } = {}) {
  return query<BookingListRow>(
    `SELECT b.id, b.start_time, b.end_time, b.status, b.source, b.price_cents, b.client_id,
            c.name AS client_name, c.phone_e164, d.name AS dog_name, s.name AS service_name, st.name AS staff_name
     FROM bookings b
     JOIN clients c ON c.id = b.client_id
     LEFT JOIN dogs d ON d.id = b.dog_id
     JOIN services s ON s.id = b.service_id
     JOIN staff st ON st.id = b.staff_id
     WHERE b.account_id = $1 AND b.start_time >= $2 AND b.start_time < $3
       ${opts.includeCancelled ? "" : "AND b.status <> 'cancelled'"}
     ORDER BY b.start_time`,
    [accountId, from, to],
  );
}

/**
 * Revenue Recovered: money from visits the platform plausibly saved.
 *  - reminded:  completed visits where the client replied C to the reminder
 *  - rebooked:  completed visits booked from a rebooking nudge
 */
export async function revenueRecovered(accountId: string) {
  const [r] = await query<{ reminded_cents: string; reminded_n: string; rebooked_cents: string; rebooked_n: string }>(
    `SELECT
       COALESCE(SUM(b.price_cents) FILTER (WHERE j.outcome = 'confirmed'), 0) AS reminded_cents,
       COUNT(*) FILTER (WHERE j.outcome = 'confirmed') AS reminded_n,
       COALESCE(SUM(b.price_cents) FILTER (WHERE b.source = 'rebook'), 0) AS rebooked_cents,
       COUNT(*) FILTER (WHERE b.source = 'rebook') AS rebooked_n
     FROM bookings b
     LEFT JOIN jobs j ON j.booking_id = b.id AND j.kind = 'reminder'
     WHERE b.account_id = $1 AND b.status = 'completed'`,
    [accountId],
  );
  return {
    remindedCents: Number(r.reminded_cents),
    remindedCount: Number(r.reminded_n),
    rebookedCents: Number(r.rebooked_cents),
    rebookedCount: Number(r.rebooked_n),
  };
}
