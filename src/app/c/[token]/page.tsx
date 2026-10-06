import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Flash, type SearchParams } from "@/components/ui";
import { cancelBooking } from "@/lib/bookings";
import { one } from "@/lib/db";
import { withMsg } from "@/lib/format";
import { formatDateTime } from "@/lib/time";
import type { Account, Booking } from "@/lib/types";

export const metadata = { title: "Your appointment" };

async function load(token: string) {
  const booking = await one<Booking & { service: string; dog: string | null }>(
    `SELECT b.*, s.name AS service, d.name AS dog FROM bookings b
     JOIN services s ON s.id = b.service_id LEFT JOIN dogs d ON d.id = b.dog_id WHERE b.manage_token = $1`,
    [token],
  );
  if (!booking) return null;
  const account = await one<Account>("SELECT * FROM accounts WHERE id = $1", [booking.account_id]);
  return account ? { booking, account } : null;
}

function canSelfCancel(booking: Booking, account: Account): boolean {
  return new Date(booking.start_time).getTime() - Date.now() >= account.cancel_cutoff_hours * 3600_000;
}

async function cancelAction(form: FormData) {
  "use server";
  const token = String(form.get("token"));
  const rebook = form.get("rebook") === "1";
  const data = await load(token);
  if (!data) notFound();
  const { booking, account } = data;
  const path = `/c/${token}`;
  if (!["pending", "confirmed"].includes(booking.status)) redirect(withMsg(path, "error", "This appointment can't be changed."));
  if (!canSelfCancel(booking, account)) {
    redirect(withMsg(path, "error", `Online changes close ${account.cancel_cutoff_hours} hours before the appointment. Please contact ${account.business_name}.`));
  }
  await cancelBooking(booking, "client");
  if (rebook) redirect(`/book?b=${account.slug}&service=${booking.service_id}`);
  redirect(withMsg(path, "ok", "Your appointment is cancelled."));
}

export default async function ManageBooking({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: SearchParams }) {
  const { token } = await params;
  const sp = await searchParams;
  const data = await load(token);
  if (!data) notFound();
  const { booking, account } = data;
  const active = booking.status === "pending" || booking.status === "confirmed";
  const upcoming = new Date(booking.start_time).getTime() > Date.now();
  const allowed = canSelfCancel(booking, account);

  return (
    <main className="wrap narrow">
      <h1 style={{ marginTop: 16 }}>{account.business_name}</h1>
      <Flash sp={sp} />
      <div className="card">
        <p>
          <strong>{booking.service}</strong>
          {booking.dog && ` for ${booking.dog}`}
        </p>
        <p>{formatDateTime(new Date(booking.start_time), account.timezone)}</p>
        <p className="muted small">Status: {booking.status.replace("_", "-")}</p>
      </div>

      {active && upcoming && allowed && account.status === "active" && (
        <div className="card">
          {account.cancellation_policy && <p className="small">Cancellation policy: {account.cancellation_policy}</p>}
          <form action={cancelAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="rebook" value="1" />
            <button className="block secondary">Reschedule (pick a new time)</button>
          </form>
          <form action={cancelAction}>
            <input type="hidden" name="token" value={token} />
            <button className="block danger">Cancel appointment</button>
          </form>
          <p className="hint">Rescheduling cancels this time first, then lets you pick a new one.</p>
        </div>
      )}
      {active && upcoming && !allowed && (
        <div className="msg warn">
          Online changes close {account.cancel_cutoff_hours} hours before the appointment. Please contact {account.business_name}
          {account.phone ? ` at ${account.phone}` : ""}.
        </div>
      )}
      {booking.status === "cancelled" && account.status === "active" && (
        <Link className="btn block" href={`/book?b=${account.slug}`}>
          Book again
        </Link>
      )}
    </main>
  );
}
