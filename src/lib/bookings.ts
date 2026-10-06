import { freeStaffAt, goLiveIssues, SELF_SERVE_MIN_LEAD_MS, staffIsFree } from "./availability";
import { createCalendarEvent, deleteCalendarEvent } from "./calendar";
import { isUniqueViolation, one, query, tx } from "./db";
import { token } from "./format";
import { normalizePhone } from "./phone";
import { hasFeature } from "./plans";
import { sendSms } from "./sms";
import { formatDateTime, ymdInTz } from "./time";
import type { Account, Booking, Service, Staff } from "./types";

export function consentText(businessName: string): string {
  return `I agree to receive appointment texts (confirmations, reminders, rebooking and review requests) from ${businessName}. Msg & data rates may apply. Reply STOP to opt out.`;
}

export const SLOT_TAKEN_MSG = "Sorry, that time was just taken by someone else. Please pick another time and try again.";

export type Source = "organic" | "meta" | "referral" | "rebook" | "owner";

export function sourceFrom(params: { src?: string; utm_source?: string; ref?: string }): Source {
  const s = (params.src ?? params.utm_source ?? "").toLowerCase();
  if (["meta", "facebook", "fb", "instagram", "ig"].includes(s)) return "meta";
  if (s === "rebook") return "rebook";
  if (s === "referral" || params.ref) return "referral";
  return "organic";
}

interface CreateArgs {
  account: Account;
  service: Service;
  start: Date;
  staffId?: string;
  selfServe: boolean;
  client: { name: string; phone: string; email?: string };
  dog: { name: string; breed?: string; size?: string };
  consent: boolean;
  source: Source;
}

export type CreateResult = { ok: true; booking: Booking } | { ok: false; error: string; taken?: boolean };

export async function createBooking(a: CreateArgs): Promise<CreateResult> {
  const { account, service } = a;
  const services = await query<Service>("SELECT * FROM services WHERE account_id = $1", [account.id]);
  if (a.selfServe) {
    const issues = goLiveIssues(account, services);
    if (issues.length) return { ok: false, error: "This booking page isn't accepting bookings yet." };
  } else if (account.status !== "active") {
    return { ok: false, error: "This account is closed." };
  }
  if (!service.active || service.account_id !== account.id) return { ok: false, error: "That service isn't available." };

  const name = a.client.name.trim();
  const phone = normalizePhone(a.client.phone);
  const dogName = a.dog.name.trim();
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!phone) return { ok: false, error: "Please enter a valid mobile number, like (315) 555-0100." };
  if (!dogName) return { ok: false, error: "Please enter your dog's name." };
  if (Number.isNaN(a.start.getTime())) return { ok: false, error: "Please pick a time." };
  if (a.selfServe && a.start.getTime() < Date.now() + SELF_SERVE_MIN_LEAD_MS) {
    return { ok: false, error: "Online bookings must be at least 24 hours in advance. Please pick a later time." };
  }
  if (!a.selfServe && a.start.getTime() < Date.now() - 3600_000) {
    return { ok: false, error: "That time is in the past." };
  }

  const end = new Date(a.start.getTime() + service.duration_min * 60_000);

  // Pick a staff member who is still free at confirm time.
  let staffId: string | undefined;
  if (a.selfServe) {
    const free = await freeStaffAt(account, service, ymdInTz(a.start, account.timezone), a.start, {
      selfServe: true,
      staffId: a.staffId,
    });
    staffId = free[0];
  } else {
    const staff = await one<Staff>("SELECT * FROM staff WHERE id = $1 AND account_id = $2 AND active", [
      a.staffId,
      account.id,
    ]);
    if (staff && (await staffIsFree(account, staff, a.start, end))) staffId = staff.id;
    else if (staff) return { ok: false, error: `${staff.name} already has something at that time.`, taken: true };
  }
  if (!staffId) return { ok: false, error: SLOT_TAKEN_MSG, taken: true };

  const consentAt = a.consent ? new Date() : null;
  try {
    const booking = await tx(async (q) => {
      const [client] = await q.query<{ id: string }>(
        `INSERT INTO clients (account_id, name, phone_e164, email, sms_consent, sms_consent_at, sms_consent_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (account_id, phone_e164) DO UPDATE SET
           name = EXCLUDED.name,
           email = COALESCE(EXCLUDED.email, clients.email),
           sms_consent = clients.sms_consent OR EXCLUDED.sms_consent,
           sms_consent_at = COALESCE(EXCLUDED.sms_consent_at, clients.sms_consent_at),
           sms_consent_text = COALESCE(EXCLUDED.sms_consent_text, clients.sms_consent_text),
           sms_opted_out_at = CASE WHEN EXCLUDED.sms_consent THEN NULL ELSE clients.sms_opted_out_at END
         RETURNING id`,
        [
          account.id,
          name,
          phone,
          a.client.email?.trim() || null,
          a.consent,
          consentAt,
          a.consent ? consentText(account.business_name) : null,
        ],
      );
      let [dog] = await q.query<{ id: string }>(
        "SELECT id FROM dogs WHERE client_id = $1 AND lower(name) = lower($2) LIMIT 1",
        [client.id, dogName],
      );
      if (!dog) {
        [dog] = await q.query<{ id: string }>(
          "INSERT INTO dogs (client_id, name, breed, size) VALUES ($1, $2, $3, $4) RETURNING id",
          [client.id, dogName, a.dog.breed?.trim() || null, a.dog.size?.trim() || null],
        );
      }
      const [b] = await q.query<Booking>(
        `INSERT INTO bookings (account_id, client_id, dog_id, service_id, staff_id, start_time, end_time, status, source, price_cents, manage_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9, $10) RETURNING *`,
        [account.id, client.id, dog.id, service.id, staffId, a.start, end, a.source, service.price_cents, token()],
      );
      await q.query(
        "INSERT INTO jobs (account_id, booking_id, client_id, kind, run_at) VALUES ($1, $2, $3, 'confirmation', now()) ON CONFLICT DO NOTHING",
        [account.id, b.id, client.id],
      );
      const reminderAt = new Date(a.start.getTime() - 24 * 3600_000);
      if (reminderAt.getTime() > Date.now()) {
        await q.query(
          "INSERT INTO jobs (account_id, booking_id, client_id, kind, run_at) VALUES ($1, $2, $3, 'reminder', $4) ON CONFLICT DO NOTHING",
          [account.id, b.id, client.id, reminderAt],
        );
      }
      return b;
    });

    const eventId = await createCalendarEvent(staffId, {
      summary: `${service.name}: ${dogName} (${name})`,
      description: `Booked via PetPro OS. Client phone ${phone}.`,
      start: a.start,
      end,
      bookingId: booking.id,
    });
    if (eventId) await query("UPDATE bookings SET external_event_id = $1 WHERE id = $2", [eventId, booking.id]);
    return { ok: true, booking };
  } catch (e) {
    // Decision #19: no hold step. The unique (staff, start) index rejects the colliding write.
    if (isUniqueViolation(e)) return { ok: false, error: SLOT_TAKEN_MSG, taken: true };
    throw e;
  }
}

export async function cancelBooking(booking: Booking, by: "client" | "team") {
  const updated = await one<Booking>(
    "UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE id = $1 AND status IN ('pending','confirmed') RETURNING *",
    [booking.id],
  );
  if (!updated) return;
  await query("UPDATE jobs SET status = 'cancelled', done_at = now() WHERE booking_id = $1 AND status = 'pending'", [
    booking.id,
  ]);
  await query("UPDATE jobs SET outcome = 'cancelled' WHERE booking_id = $1 AND kind = 'reminder' AND status = 'sent'", [
    booking.id,
  ]);
  await deleteCalendarEvent(booking.staff_id, booking.external_event_id);

  if (by === "client") {
    const account = await one<Account>("SELECT * FROM accounts WHERE id = $1", [booking.account_id]);
    const info = await one<{ client: string; dog: string | null; service: string }>(
      `SELECT c.name AS client, d.name AS dog, s.name AS service FROM bookings b
       JOIN clients c ON c.id = b.client_id LEFT JOIN dogs d ON d.id = b.dog_id JOIN services s ON s.id = b.service_id
       WHERE b.id = $1`,
      [booking.id],
    );
    if (account?.phone && info) {
      await sendSms({
        account,
        to: account.phone,
        body: `${info.client} cancelled ${info.service}${info.dog ? ` for ${info.dog}` : ""} on ${formatDateTime(new Date(booking.start_time), account.timezone)}. The slot is open again.`,
      });
    }
  }
}

export async function completeBooking(booking: Booking, account: Account) {
  const updated = await one<Booking>(
    "UPDATE bookings SET status = 'completed' WHERE id = $1 AND status IN ('pending','confirmed','no_show') RETURNING *",
    [booking.id],
  );
  if (!updated) return;
  const service = await one<Service>("SELECT * FROM services WHERE id = $1", [booking.service_id]);

  if (hasFeature(account.plan, "reviews") && account.review_link) {
    await query(
      "INSERT INTO jobs (account_id, booking_id, client_id, kind, run_at) VALUES ($1, $2, $3, 'review', now() + interval '1 hour') ON CONFLICT DO NOTHING",
      [account.id, booking.id, booking.client_id],
    );
  }
  const cycle = service?.rebook_cycle_days ?? account.default_rebook_days;
  if (hasFeature(account.plan, "rebooking") && cycle && cycle > 0) {
    // Nudge a week before the cycle is due (or at 75% of short cycles).
    const leadDays = cycle > 14 ? 7 : Math.ceil(cycle * 0.25);
    const runAt = new Date(Math.max(Date.now(), new Date(booking.start_time).getTime() + (cycle - leadDays) * 86400_000));
    await query(
      "INSERT INTO jobs (account_id, booking_id, client_id, kind, run_at) VALUES ($1, $2, $3, 'rebook', $4) ON CONFLICT DO NOTHING",
      [account.id, booking.id, booking.client_id, runAt],
    );
  }
}

export async function markNoShow(booking: Booking) {
  await query("UPDATE bookings SET status = 'no_show' WHERE id = $1 AND status IN ('pending','confirmed','completed')", [
    booking.id,
  ]);
  await query("UPDATE jobs SET status = 'cancelled', done_at = now() WHERE booking_id = $1 AND status = 'pending'", [
    booking.id,
  ]);
}
