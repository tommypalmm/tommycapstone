import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, ErrorBox, Flash, param, type SearchParams } from "@/components/ui";
import { availableSlots, goLiveIssues, selfServeWindow, type Slot } from "@/lib/availability";
import { consentText } from "@/lib/bookings";
import { CalendarUnavailableError } from "@/lib/calendar";
import { one, query } from "@/lib/db";
import { money } from "@/lib/format";
import { addDaysYmd, formatDateTime, formatDay, formatTime, ymdInTz } from "@/lib/time";
import type { Account, Service } from "@/lib/types";
import { BookingForm } from "./BookingForm";
import { accountBySlug, bookUrl, CARRY, MetaPixel } from "./shared";

export const metadata = { title: "Book an appointment" };

function Shell({ account, embed, children }: { account: Account; embed: boolean; children: React.ReactNode }) {
  return (
    <main className="wrap narrow" style={embed ? { padding: 8 } : undefined}>
      <MetaPixel pixelId={account.meta_pixel_id} />
      {!embed && <h1 style={{ marginTop: 16 }}>{account.business_name}</h1>}
      {children}
    </main>
  );
}

async function firstDayWithSlots(account: Account, service: Service, from: string, last: string): Promise<string | null> {
  for (let i = 0; i < 21; i++) {
    const d = addDaysYmd(from, i);
    if (d > last) break;
    if ((await availableSlots(account, service, d, { selfServe: true })).length) return d;
  }
  return null;
}

export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const carry: Record<string, string | undefined> = Object.fromEntries(CARRY.map((k) => [k, param(sp, k)]));
  const account = await accountBySlug(carry.b);
  if (!account) notFound();
  const embed = carry.embed === "1";

  if (account.status !== "active") {
    return (
      <Shell account={account} embed={embed}>
        <div className="card empty">
          <strong>{account.business_name} isn&apos;t taking online bookings anymore.</strong>
          {account.phone && <p>Please contact them directly.</p>}
        </div>
      </Shell>
    );
  }

  const services = await query<Service>("SELECT * FROM services WHERE account_id = $1 ORDER BY type, name", [account.id]);
  const issues = goLiveIssues(account, services);
  if (issues.length) {
    return (
      <Shell account={account} embed={embed}>
        <div className="card empty">
          <strong>Online booking isn&apos;t open yet.</strong>
          <p>Please check back soon, or contact {account.business_name} directly.</p>
        </div>
      </Shell>
    );
  }
  const active = services.filter((s) => s.active && s.duration_min > 0);
  const tz = account.timezone;

  // Done
  const doneToken = param(sp, "done");
  if (doneToken) {
    const b = await one<{ start_time: Date; service: string; dog: string | null; consent: boolean; deposit_cents: number }>(
      `SELECT b.start_time, s.name AS service, d.name AS dog, c.sms_consent AS consent, s.deposit_cents
       FROM bookings b JOIN services s ON s.id = b.service_id JOIN clients c ON c.id = b.client_id LEFT JOIN dogs d ON d.id = b.dog_id
       WHERE b.manage_token = $1 AND b.account_id = $2`,
      [doneToken, account.id],
    );
    if (!b) notFound();
    return (
      <Shell account={account} embed={embed}>
        <MetaPixel pixelId={account.meta_pixel_id} event="Schedule" />
        <div className="msg ok">
          <strong>You&apos;re booked!</strong>
        </div>
        <div className="card">
          <p>
            <strong>{b.service}</strong>
            {b.dog && ` for ${b.dog}`}
          </p>
          <p>{formatDateTime(new Date(b.start_time), tz)}</p>
          {b.deposit_cents > 0 && (
            <p className="small">
              A {money(b.deposit_cents)} deposit applies. {account.deposit_policy ?? `${account.business_name} will follow up about it.`}
            </p>
          )}
          <p className="muted small">
            {b.consent ? "We'll text you a confirmation now and a reminder before your visit." : "Save this page. You didn't opt in to texts."}
          </p>
          <Link className="btn secondary block" href={`/c/${doneToken}`}>
            Change or cancel
          </Link>
        </div>
      </Shell>
    );
  }

  // Step 1: service
  const serviceId = param(sp, "service");
  const service = active.find((s) => s.id === serviceId);
  if (!service) {
    return (
      <Shell account={account} embed={embed}>
        <Flash sp={sp} />
        <h2>Choose a service</h2>
        {active.length === 0 ? (
          <div className="card">
            <Empty title="No services are available right now." />
          </div>
        ) : (
          <ul className="list card">
            {active.map((s) => (
              <li key={s.id}>
                <Link href={bookUrl(carry, { service: s.id })} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="spread">
                    <strong>{s.name}</strong>
                    <span>{money(s.price_cents)}</span>
                  </div>
                  <div className="muted small">
                    {s.type === "training" ? "Training" : "Grooming"} · {s.duration_min} min
                    {s.deposit_cents > 0 && ` · ${money(s.deposit_cents)} deposit`}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Shell>
    );
  }

  // Step 3: details (time chosen)
  const time = param(sp, "time");
  const date = param(sp, "date");
  if (time && date) {
    const start = new Date(time);
    return (
      <Shell account={account} embed={embed}>
        <p>
          <Link href={bookUrl(carry, { service: service.id, date })}>← Pick a different time</Link>
        </p>
        <h2>
          {service.name}
          <br />
          <span className="muted">{formatDateTime(start, tz)}</span>
        </h2>
        {(account.cancellation_policy || account.deposit_policy || service.deposit_cents > 0) && (
          <div className="card small">
            {service.deposit_cents > 0 && <p>Deposit: {money(service.deposit_cents)}. {account.deposit_policy}</p>}
            {account.cancellation_policy && <p>Cancellation: {account.cancellation_policy}</p>}
            {account.refund_policy && <p>Refunds: {account.refund_policy}</p>}
          </div>
        )}
        <BookingForm
          hidden={{
            ...(Object.fromEntries(Object.entries(carry).filter(([, v]) => v)) as Record<string, string>),
            service: service.id,
            time,
            date,
          }}
          consentText={consentText(account.business_name)}
          submitLabel="Confirm booking"
        />
      </Shell>
    );
  }

  // Step 2: time
  // Only offer days inside the owner's booking window (min notice to max days ahead).
  const window = selfServeWindow(account);
  const firstDay = ymdInTz(new Date(window.earliest), tz);
  const lastDay = ymdInTz(new Date(window.latest), tz);
  let slots: Slot[] = [];
  let calendarError: string | null = null;
  let day = date && date >= firstDay && date <= lastDay ? date : null;
  try {
    day ??= (await firstDayWithSlots(account, service, firstDay, lastDay)) ?? firstDay;
    slots = await availableSlots(account, service, day, { selfServe: true });
  } catch (e) {
    if (!(e instanceof CalendarUnavailableError)) throw e;
    calendarError = e.message;
    day ??= firstDay;
  }
  const days = Array.from({ length: 14 }, (_, i) => addDaysYmd(firstDay, i)).filter((d) => d <= lastDay);
  if (!days.includes(day)) days.unshift(day);

  return (
    <Shell account={account} embed={embed}>
      <p>
        <Link href={bookUrl(carry)}>← Services</Link>
      </p>
      <h2>{service.name}</h2>
      <Flash sp={sp} />
      <div className="days" role="list">
        {days.map((d) => (
          <Link key={d} role="listitem" className={d === day ? "on" : ""} href={bookUrl(carry, { service: service.id, date: d })}>
            {formatDay(d).split(",")[0].slice(0, 3)}
            <br />
            <strong>{Number(d.slice(8))}</strong>
          </Link>
        ))}
      </div>
      <h3>{formatDay(day)}</h3>
      {calendarError ? (
        <ErrorBox title="Can't load times right now.">{calendarError}</ErrorBox>
      ) : slots.length === 0 ? (
        <div className="card">
          <Empty title="No open times this day.">
            <p>
              Try another day. Online bookings need at least {account.min_notice_hours} hours&apos; notice and open up to{" "}
              {account.max_advance_days} days ahead.
            </p>
          </Empty>
        </div>
      ) : (
        <div className="slots">
          {slots.map((s) => (
            <Link key={s.start.toISOString()} href={bookUrl(carry, { service: service.id, date: day, time: s.start.toISOString() })}>
              {formatTime(s.start, tz)}
            </Link>
          ))}
        </div>
      )}
      <p className="muted small" style={{ marginTop: 16 }}>
        Times shown in {tz.replace("_", " ")}.
      </p>
    </Shell>
  );
}
