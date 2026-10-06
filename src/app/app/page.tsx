import Link from "next/link";
import { Empty, Flash, StatusTag, type SearchParams } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { goLiveIssues } from "@/lib/availability";
import { query } from "@/lib/db";
import { appUrl, money } from "@/lib/format";
import { listBookings, revenueRecovered, type BookingListRow } from "@/lib/queries";
import { addDaysYmd, formatDay, formatTime, ymdInTz, zonedToUtc } from "@/lib/time";
import type { Service } from "@/lib/types";

function BookingRows({ rows, tz }: { rows: BookingListRow[]; tz: string }) {
  return (
    <ul className="list">
      {rows.map((b) => (
        <li key={b.id}>
          <Link href={`/app/bookings/${b.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="spread">
              <strong>{formatTime(new Date(b.start_time), tz)}</strong>
              <StatusTag status={b.status} />
            </div>
            <div>
              {b.dog_name ?? "Dog"} · {b.client_name}
            </div>
            <div className="muted small">
              {b.service_name} · with {b.staff_name}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { account, isOwner } = await requireMember();
  const tz = account.timezone;
  const today = ymdInTz(new Date(), tz);
  const startToday = zonedToUtc(today, "00:00", tz);
  const startTomorrow = zonedToUtc(addDaysYmd(today, 1), "00:00", tz);
  const endWeek = zonedToUtc(addDaysYmd(today, 8), "00:00", tz);

  const [services, todays, week, recovered, alerts] = await Promise.all([
    query<Service>("SELECT * FROM services WHERE account_id = $1", [account.id]),
    listBookings(account.id, startToday, startTomorrow),
    listBookings(account.id, startTomorrow, endWeek),
    revenueRecovered(account.id),
    query<{ kind: string; text: string; at: Date }>(
      `SELECT 'cancel' AS kind, c.name || ' cancelled ' || s.name AS text, b.cancelled_at AS at
         FROM bookings b JOIN clients c ON c.id = b.client_id JOIN services s ON s.id = b.service_id
         WHERE b.account_id = $1 AND b.cancelled_at > now() - interval '7 days'
       UNION ALL
       SELECT 'failed', 'A ' || j.kind || ' text failed to send: ' || COALESCE(j.last_error, 'unknown error'), j.done_at
         FROM jobs j WHERE j.account_id = $1 AND j.status = 'failed' AND j.done_at > now() - interval '7 days'
       UNION ALL
       SELECT 'calendar', st.name || '''s Google Calendar has a problem: ' || COALESCE(cc.last_error, 'unknown'), now()
         FROM calendar_connections cc JOIN staff st ON st.id = cc.staff_id
         WHERE st.account_id = $1 AND cc.sync_state = 'error'
       ORDER BY at DESC LIMIT 10`,
      [account.id],
    ),
  ]);
  const issues = goLiveIssues(account, services);
  const bookingLink = `${appUrl()}/book?b=${account.slug}`;
  const recoveredTotal = recovered.remindedCents + recovered.rebookedCents;

  // Group the week by local day.
  const byDay = new Map<string, BookingListRow[]>();
  for (const b of week) {
    const d = ymdInTz(new Date(b.start_time), tz);
    byDay.set(d, [...(byDay.get(d) ?? []), b]);
  }

  return (
    <>
      <Flash sp={sp} />
      {account.status !== "active" && (
        <div className="msg warn">This account is closed. Your booking page is offline. You can still export your data.</div>
      )}
      {issues.length > 0 && account.status === "active" && (
        <div className="msg warn">
          <strong>Your booking page isn&apos;t live yet.</strong>
          <ul style={{ margin: "6px 0" }}>
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          {isOwner ? <Link href="/app/settings">Finish setup →</Link> : <span>Ask the owner to finish setup.</span>}
        </div>
      )}

      <div className="card">
        <div className="spread">
          <h2 style={{ margin: 0 }}>Today · {formatDay(today)}</h2>
          <Link href="/app/bookings/new">+ Add booking</Link>
        </div>
        {todays.length === 0 ? (
          <Empty title="No appointments today.">
            <p>When clients book, or you add a booking, they show up here, soonest first.</p>
          </Empty>
        ) : (
          <BookingRows rows={todays} tz={tz} />
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Next 7 days</h2>
        {week.length === 0 ? (
          <Empty title="Nothing booked this week yet.">
            {issues.length === 0 && (
              <p>
                Share your booking link: <a href={bookingLink}>{bookingLink}</a>
              </p>
            )}
          </Empty>
        ) : (
          [...byDay.entries()].map(([d, rows]) => (
            <div key={d}>
              <h3>{formatDay(d)}</h3>
              <BookingRows rows={rows} tz={tz} />
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Revenue Recovered</h2>
        <div className="big">{money(recoveredTotal)}</div>
        <p className="muted small">
          {recovered.remindedCount} visit{recovered.remindedCount === 1 ? "" : "s"} confirmed by text reminder (
          {money(recovered.remindedCents)}) · {recovered.rebookedCount} visit{recovered.rebookedCount === 1 ? "" : "s"}{" "}
          from rebooking nudges ({money(recovered.rebookedCents)}). Counts completed visits only.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Alerts</h2>
        {alerts.length === 0 ? (
          <Empty title="All clear.">
            <p>Client cancellations, failed texts, and calendar problems from the last 7 days show here.</p>
          </Empty>
        ) : (
          <ul className="list">
            {alerts.map((a, i) => (
              <li key={i}>
                <span className={`tag ${a.kind === "cancel" ? "" : "failed"}`}>{a.kind}</span> {a.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {issues.length === 0 && (
        <p className="muted small">
          Your booking link: <a href={bookingLink}>{bookingLink}</a>
        </p>
      )}
    </>
  );
}
