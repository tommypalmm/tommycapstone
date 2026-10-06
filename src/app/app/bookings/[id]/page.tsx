import Link from "next/link";
import { notFound } from "next/navigation";
import { saveNotes, setBookingStatus } from "@/app/actions/bookings";
import { Empty, Flash, StatusTag, type SearchParams } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { appUrl, money } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { hasFeature } from "@/lib/plans";
import { formatDateTime } from "@/lib/time";

interface Detail {
  id: string;
  start_time: Date;
  end_time: Date;
  status: string;
  source: string;
  price_cents: number;
  manage_token: string;
  external_event_id: string | null;
  client_id: string;
  client_name: string;
  phone_e164: string;
  sms_consent: boolean;
  sms_opted_out_at: Date | null;
  dog_name: string | null;
  dog_breed: string | null;
  service_name: string;
  service_type: string;
  staff_name: string;
}

function StatusButton({ id, status, label, danger }: { id: string; status: string; label: string; danger?: boolean }) {
  return (
    <form action={setBookingStatus} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={danger ? "danger" : "secondary"}>{label}</button>
    </form>
  );
}

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const { account } = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const b = await one<Detail>(
    `SELECT b.*, c.name AS client_name, c.phone_e164, c.sms_consent, c.sms_opted_out_at,
            d.name AS dog_name, d.breed AS dog_breed, s.name AS service_name, s.type AS service_type, st.name AS staff_name
     FROM bookings b JOIN clients c ON c.id = b.client_id LEFT JOIN dogs d ON d.id = b.dog_id
     JOIN services s ON s.id = b.service_id JOIN staff st ON st.id = b.staff_id
     WHERE b.id = $1 AND b.account_id = $2`,
    [id, account.id],
  );
  if (!b) notFound();
  const [notes, jobs] = await Promise.all([
    one<{ notes: string | null; homework: string | null; share_token: string }>(
      "SELECT notes, homework, share_token FROM session_notes WHERE booking_id = $1",
      [b.id],
    ),
    query<{ kind: string; status: string; outcome: string | null; run_at: Date; last_error: string | null }>(
      "SELECT kind, status, outcome, run_at, last_error FROM jobs WHERE booking_id = $1 ORDER BY run_at",
      [b.id],
    ),
  ]);
  const tz = account.timezone;
  const open = b.status === "pending" || b.status === "confirmed";

  return (
    <>
      <p>
        <Link href="/app">← Today</Link>
      </p>
      <Flash sp={sp} />
      <div className="card">
        <div className="spread">
          <h1 style={{ margin: 0 }}>{b.dog_name ?? "Booking"}</h1>
          <StatusTag status={b.status} />
        </div>
        <p>
          <strong>{b.service_name}</strong> · {money(b.price_cents)}
        </p>
        <p>{formatDateTime(new Date(b.start_time), tz)} · with {b.staff_name}</p>
        <p>
          <Link href={`/app/clients/${b.client_id}`}>{b.client_name}</Link> · <a href={`tel:${b.phone_e164}`}>{formatPhone(b.phone_e164)}</a>
        </p>
        <p className="muted small">
          Source: {b.source} · Texts: {b.sms_opted_out_at ? "opted out (STOP)" : b.sms_consent ? "opted in" : "no consent"}
          {b.external_event_id && " · on Google Calendar"}
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          {b.status !== "completed" && b.status !== "cancelled" && <StatusButton id={b.id} status="completed" label="Mark completed" />}
          {open && <StatusButton id={b.id} status="no_show" label="No-show" />}
          {open && <StatusButton id={b.id} status="cancelled" label="Cancel booking" danger />}
        </div>
      </div>

      {hasFeature(account.plan, "session_notes") && (
        <form action={saveNotes} className="card">
          <input type="hidden" name="id" value={b.id} />
          <h2 style={{ marginTop: 0 }}>Session notes</h2>
          <p className="muted small">The client can read these from a private link, no app needed.</p>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" defaultValue={notes?.notes ?? ""} />
          <label htmlFor="homework">Homework</label>
          <textarea id="homework" name="homework" defaultValue={notes?.homework ?? ""} />
          <div className="row" style={{ marginTop: 12 }}>
            <button>Save notes</button>
            <button name="send" value="1" className="secondary">
              Save &amp; text link to client
            </button>
          </div>
          {notes && (
            <p className="small">
              Client link: <a href={`${appUrl()}/n/${notes.share_token}`}>{`${appUrl()}/n/${notes.share_token}`}</a>
            </p>
          )}
        </form>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Automatic texts</h2>
        {jobs.length === 0 ? (
          <Empty title="No texts scheduled for this booking." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Text</th>
                <th>When</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.kind}>
                  <td>{j.kind.replace("_", " ")}</td>
                  <td>{formatDateTime(new Date(j.run_at), tz)}</td>
                  <td>
                    <StatusTag status={j.status} />
                    {j.outcome && ` ${j.outcome}`}
                    {j.last_error && <div className="small muted">{j.last_error}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="small muted">
          Client&apos;s manage link: <a href={`/c/${b.manage_token}`}>/c/{b.manage_token}</a>
        </p>
      </div>
    </>
  );
}
