"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseHours } from "@/components/HoursFields";
import { hashPassword, requireOwner } from "@/lib/auth";
import { deleteCalendarEvent } from "@/lib/calendar";
import { one, query, tx } from "@/lib/db";
import { intOrNull, parseMoney, str, withMsg } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { hasFeature, maxStaff } from "@/lib/plans";
import { sendSms } from "@/lib/sms";
import { formatDateTime, isValidTimeZone } from "@/lib/time";

const SETTINGS = "/app/settings";

function done(path: string, msg: string): never {
  revalidatePath("/app", "layout");
  redirect(withMsg(path, "ok", msg));
}

function fail(path: string, msg: string): never {
  redirect(withMsg(path, "error", msg));
}

export async function saveEssentials(form: FormData) {
  const { account } = await requireOwner();
  const hours = parseHours(form);
  if (typeof hours === "string") fail(SETTINGS, hours);
  const interval = intOrNull(form.get("booking_interval_min"));
  const buffer = intOrNull(form.get("buffer_minutes")) ?? 0;
  const timezone = str(form.get("timezone"));
  const minNotice = intOrNull(form.get("min_notice_hours"));
  const maxAdvance = intOrNull(form.get("max_advance_days"));
  if (!interval || interval < 5 || interval > 480) fail(SETTINGS, "Booking interval must be between 5 and 480 minutes.");
  if (buffer < 0 || buffer > 240) fail(SETTINGS, "Buffer must be between 0 and 240 minutes.");
  if (!isValidTimeZone(timezone)) fail(SETTINGS, "Please pick a valid time zone.");
  // Decision #7: online bookings always need at least 24 hours' notice.
  if (minNotice === null || minNotice < 24 || minNotice > 720) fail(SETTINGS, "Minimum notice must be between 24 and 720 hours.");
  if (maxAdvance === null || maxAdvance < 1 || maxAdvance > 365) fail(SETTINGS, "Book up to must be between 1 and 365 days.");
  if (minNotice >= maxAdvance * 24) fail(SETTINGS, "Book up to must be further out than the minimum notice.");
  await query(
    `UPDATE accounts SET operating_hours = $1, booking_interval_min = $2, buffer_minutes = $3, timezone = $4,
       min_notice_hours = $5, max_advance_days = $6
     WHERE id = $7`,
    [JSON.stringify(hours), interval, buffer, timezone, minNotice, maxAdvance, account.id],
  );
  done(SETTINGS, "Hours and scheduling saved.");
}

export async function saveBusiness(form: FormData) {
  const { account } = await requireOwner();
  const name = str(form.get("business_name"));
  const phoneRaw = str(form.get("phone"));
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (!name) fail(SETTINGS, "Business name can't be empty.");
  if (phoneRaw && !phone) fail(SETTINGS, "Please enter a valid mobile number.");
  const url = (v: string) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v) || null;
  await query(
    `UPDATE accounts SET business_name = $1, owner_name = $2, phone = $3, contact_link = $4, review_link = $5, meta_pixel_id = $6
     WHERE id = $7`,
    [
      name,
      str(form.get("owner_name")) || account.owner_name,
      phone,
      url(str(form.get("contact_link"))),
      url(str(form.get("review_link"))),
      str(form.get("meta_pixel_id")).replace(/\D/g, "") || null,
      account.id,
    ],
  );
  done(SETTINGS, "Business details saved.");
}

export async function savePolicies(form: FormData) {
  const { account } = await requireOwner();
  const cutoff = intOrNull(form.get("cancel_cutoff_hours")) ?? 0;
  const rebook = intOrNull(form.get("default_rebook_days"));
  if (cutoff < 0 || cutoff > 168) fail(SETTINGS, "Cancellation cutoff must be between 0 and 168 hours.");
  if (rebook !== null && (rebook < 1 || rebook > 365)) fail(SETTINGS, "Rebook cycle must be between 1 and 365 days.");
  await query(
    `UPDATE accounts SET cancel_cutoff_hours = $1, cancellation_policy = $2, deposit_policy = $3, refund_policy = $4,
       default_rebook_days = $5 WHERE id = $6`,
    [
      cutoff,
      str(form.get("cancellation_policy")) || null,
      str(form.get("deposit_policy")) || null,
      str(form.get("refund_policy")) || null,
      rebook,
      account.id,
    ],
  );
  done(SETTINGS, "Policies saved.");
}

export async function saveIntegrations(form: FormData) {
  const { account } = await requireOwner();
  const fromRaw = str(form.get("twilio_from_number"));
  const from = fromRaw ? normalizePhone(fromRaw) : null;
  if (fromRaw && !from) fail(SETTINGS, "Twilio number must be a valid phone number.");
  const processor = str(form.get("processor"));
  await query("UPDATE accounts SET twilio_subaccount_sid = $1, twilio_from_number = $2, processor = $3 WHERE id = $4", [
    str(form.get("twilio_subaccount_sid")) || null,
    from,
    processor === "stripe" || processor === "square" ? processor : null,
    account.id,
  ]);
  done(SETTINGS, "Integrations saved.");
}

// ---- Services ----

const SERVICES = "/app/settings/services";

function readService(form: FormData) {
  const name = str(form.get("name"));
  const type = str(form.get("type"));
  const duration = intOrNull(form.get("duration_min"));
  const price = parseMoney(form.get("price"));
  const deposit = parseMoney(form.get("deposit"));
  const cycle = intOrNull(form.get("rebook_cycle_days"));
  if (!name) return "Service name is required.";
  if (type !== "grooming" && type !== "training") return "Pick grooming or training.";
  if (!duration || duration < 5 || duration > 24 * 60) return "Duration must be between 5 and 1440 minutes.";
  if (price === null) return "Price must be a number, like 65 or 65.00.";
  if (deposit === null) return "Deposit must be a number.";
  if (cycle !== null && (cycle < 1 || cycle > 365)) return "Rebook cycle must be between 1 and 365 days.";
  return {
    name,
    type,
    size_tier: str(form.get("size_tier")) || null,
    duration,
    price,
    requires_deposit: deposit > 0,
    deposit,
    cycle,
    active: form.get("active") !== null,
  };
}

export async function saveService(form: FormData) {
  const { account } = await requireOwner();
  const id = str(form.get("id"));
  const s = readService(form);
  if (typeof s === "string") fail(SERVICES, s);
  if (id) {
    await query(
      `UPDATE services SET name=$1, type=$2, size_tier=$3, duration_min=$4, price_cents=$5, requires_deposit=$6,
         deposit_cents=$7, rebook_cycle_days=$8, active=$9 WHERE id=$10 AND account_id=$11`,
      [s.name, s.type, s.size_tier, s.duration, s.price, s.requires_deposit, s.deposit, s.cycle, s.active, id, account.id],
    );
  } else {
    await query(
      `INSERT INTO services (account_id, name, type, size_tier, duration_min, price_cents, requires_deposit, deposit_cents, rebook_cycle_days, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
      [account.id, s.name, s.type, s.size_tier, s.duration, s.price, s.requires_deposit, s.deposit, s.cycle],
    );
  }
  done(SERVICES, id ? "Service updated." : "Service added.");
}

// ---- Staff ----

const STAFF = "/app/settings/staff";

export async function addStaff(form: FormData) {
  const { account } = await requireOwner();
  const name = str(form.get("name"));
  const email = str(form.get("email")).toLowerCase();
  const password = str(form.get("password"));
  if (!name) fail(STAFF, "Staff name is required.");
  const [{ n }] = await query<{ n: string }>("SELECT count(*) AS n FROM staff WHERE account_id = $1 AND active", [account.id]);
  if (!hasFeature(account.plan, "multi_staff") || Number(n) >= maxStaff(account.plan)) {
    fail(STAFF, "Your plan doesn't include more staff. Upgrade to add more.");
  }
  if (email || password) {
    if (!/^\S+@\S+\.\S+$/.test(email)) fail(STAFF, "Enter a valid email for the staff login.");
    if (password.length < 8) fail(STAFF, "Staff password must be at least 8 characters.");
    if (await one("SELECT 1 FROM users WHERE email = $1", [email])) fail(STAFF, "That email already has a login.");
  }
  const hash = password ? await hashPassword(password) : null;
  await tx(async (q) => {
    let userId: string | null = null;
    if (hash) {
      [{ id: userId }] = await q.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        [email, hash],
      );
    }
    await q.query("INSERT INTO staff (account_id, user_id, name, role) VALUES ($1, $2, $3, 'staff')", [account.id, userId, name]);
  });
  done(STAFF, `${name} added.${hash ? " They can log in with that email and password." : ""}`);
}

export async function saveStaffSchedule(form: FormData) {
  const { account } = await requireOwner();
  const id = str(form.get("id"));
  const prefix = `s${id}_`;
  const useOwn = form.get("own_hours") !== null;
  const hours = useOwn ? parseHours(form, prefix) : null;
  if (typeof hours === "string") fail(STAFF, hours);
  const buffer = intOrNull(form.get("buffer_minutes"));
  if (buffer !== null && (buffer < 0 || buffer > 240)) fail(STAFF, "Buffer must be between 0 and 240 minutes.");
  await query("UPDATE staff SET working_hours = $1, buffer_minutes = $2, name = COALESCE(NULLIF($3, ''), name) WHERE id = $4 AND account_id = $5", [
    hours ? JSON.stringify(hours) : null,
    buffer,
    str(form.get("name")),
    id,
    account.id,
  ]);
  done(STAFF, "Schedule saved.");
}

export async function deactivateStaff(form: FormData) {
  const { account } = await requireOwner();
  const id = str(form.get("id"));
  const staff = await one<{ role: string }>("SELECT role FROM staff WHERE id = $1 AND account_id = $2", [id, account.id]);
  if (!staff) fail(STAFF, "Staff member not found.");
  if (staff.role === "owner") fail(STAFF, "The owner can't be deactivated.");
  const upcoming = await one("SELECT 1 FROM bookings WHERE staff_id = $1 AND start_time > now() AND status IN ('pending','confirmed')", [id]);
  if (upcoming) fail(STAFF, "Move or cancel their upcoming bookings first.");
  await query("UPDATE staff SET active = false WHERE id = $1", [id]);
  await query("DELETE FROM sessions WHERE user_id = (SELECT user_id FROM staff WHERE id = $1)", [id]);
  done(STAFF, "Staff member deactivated.");
}

export async function disconnectCalendar(form: FormData) {
  const { account } = await requireOwner();
  await query(
    "DELETE FROM calendar_connections WHERE staff_id = $1 AND staff_id IN (SELECT id FROM staff WHERE account_id = $2)",
    [str(form.get("staff_id")), account.id],
  );
  done(STAFF, "Google Calendar disconnected.");
}

// ---- Offboarding (Decision #11) ----

export async function closeAccount(form: FormData) {
  const { account } = await requireOwner();
  if (str(form.get("confirm")) !== account.business_name) {
    fail(SETTINGS, `Type your business name exactly ("${account.business_name}") to close the account.`);
  }
  // Booking page goes offline (status check), all pending jobs are cancelled, future bookings are released.
  const future = await query<{
    staff_id: string;
    external_event_id: string | null;
    start_time: Date;
    client_id: string;
    phone_e164: string;
    can_text: boolean;
  }>(
    `SELECT b.staff_id, b.external_event_id, b.start_time, c.id AS client_id, c.phone_e164,
            (c.sms_consent AND c.sms_opted_out_at IS NULL) AS can_text
     FROM bookings b JOIN clients c ON c.id = b.client_id
     WHERE b.account_id = $1 AND b.start_time > now() AND b.status IN ('pending','confirmed')`,
    [account.id],
  );
  await tx(async (q) => {
    await q.query("UPDATE accounts SET status = 'offboarded', offboarded_at = now() WHERE id = $1", [account.id]);
    await q.query("UPDATE jobs SET status = 'cancelled', done_at = now() WHERE account_id = $1 AND status IN ('pending','running')", [
      account.id,
    ]);
    await q.query(
      "UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE account_id = $1 AND start_time > now() AND status IN ('pending','confirmed')",
      [account.id],
    );
  });
  for (const b of future) {
    await deleteCalendarEvent(b.staff_id, b.external_event_id);
    if (b.can_text) {
      await sendSms({
        account,
        to: b.phone_e164,
        clientId: b.client_id,
        body: `${account.business_name} has closed online booking, so your appointment on ${formatDateTime(new Date(b.start_time), account.timezone)} was cancelled. Please contact them directly${account.phone ? ` at ${account.phone}` : ""}.`,
      });
    }
  }
  done(SETTINGS, "Account closed. Your booking page is offline and all scheduled texts are cancelled. Download your data below.");
}
