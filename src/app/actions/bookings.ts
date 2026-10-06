"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { cancelBooking, completeBooking, createBooking, markNoShow } from "@/lib/bookings";
import { one, query } from "@/lib/db";
import { str, token, withMsg } from "@/lib/format";
import { hasFeature } from "@/lib/plans";
import { zonedToUtc } from "@/lib/time";
import type { Booking, Service } from "@/lib/types";

// Owner and staff can both manage bookings (Decision #22). Every action
// re-checks that the booking belongs to the member's account.

async function ownBooking(id: string) {
  const m = await requireMember();
  const booking = await one<Booking>("SELECT * FROM bookings WHERE id = $1 AND account_id = $2", [id, m.account.id]);
  if (!booking) redirect(withMsg("/app", "error", "Booking not found."));
  return { m, booking };
}

export async function addBooking(form: FormData) {
  const m = await requireMember();
  const serviceId = str(form.get("service"));
  const date = str(form.get("date"));
  const time = str(form.get("time"));
  const back = "/app/bookings/new";
  const service = await one<Service>("SELECT * FROM services WHERE id = $1 AND account_id = $2", [serviceId, m.account.id]);
  if (!service) redirect(withMsg(back, "error", "Pick a service."));
  if (!/^\d{4}-\d\d-\d\d$/.test(date) || !/^\d\d:\d\d$/.test(time)) redirect(withMsg(back, "error", "Pick a date and time."));

  const result = await createBooking({
    account: m.account,
    service,
    start: zonedToUtc(date, time, m.account.timezone),
    staffId: str(form.get("staff")),
    selfServe: false,
    client: { name: str(form.get("name")), phone: str(form.get("phone")), email: str(form.get("email")) },
    dog: { name: str(form.get("dog_name")), breed: str(form.get("dog_breed")) },
    consent: form.get("consent") !== null,
    source: "owner",
  });
  if (!result.ok) redirect(withMsg(back, "error", result.error));
  revalidatePath("/app");
  redirect(withMsg(`/app/bookings/${result.booking.id}`, "ok", "Booking added."));
}

export async function setBookingStatus(form: FormData) {
  const { m, booking } = await ownBooking(str(form.get("id")));
  const status = str(form.get("status"));
  const path = `/app/bookings/${booking.id}`;
  if (status === "completed") await completeBooking(booking, m.account);
  else if (status === "no_show") await markNoShow(booking);
  else if (status === "cancelled") await cancelBooking(booking, "team");
  else redirect(withMsg(path, "error", "Unknown status."));
  revalidatePath("/app");
  redirect(withMsg(path, "ok", "Booking updated."));
}

export async function saveNotes(form: FormData) {
  const { m, booking } = await ownBooking(str(form.get("id")));
  const path = `/app/bookings/${booking.id}`;
  if (!hasFeature(m.account.plan, "session_notes")) redirect(withMsg(path, "error", "Session notes aren't on your plan."));
  await query(
    `INSERT INTO session_notes (booking_id, dog_id, notes, homework, share_token) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (booking_id) DO UPDATE SET notes = EXCLUDED.notes, homework = EXCLUDED.homework, updated_at = now()`,
    [booking.id, booking.dog_id, str(form.get("notes")) || null, str(form.get("homework")) || null, token()],
  );
  if (form.get("send") !== null) {
    await query(
      `INSERT INTO jobs (account_id, booking_id, client_id, kind, run_at) VALUES ($1, $2, $3, 'notes_link', now())
       ON CONFLICT (booking_id, kind) DO UPDATE SET status = 'pending', run_at = now(), attempts = 0, last_error = NULL, done_at = NULL`,
      [m.account.id, booking.id, booking.client_id],
    );
    redirect(withMsg(path, "ok", "Notes saved. The link is being texted to the client."));
  }
  redirect(withMsg(path, "ok", "Notes saved."));
}
