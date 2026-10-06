import Link from "next/link";
import { addBooking } from "@/app/actions/bookings";
import { Empty, Flash, param, type SearchParams } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { consentText } from "@/lib/bookings";
import { one, query } from "@/lib/db";
import { money } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { addDaysYmd, ymdInTz } from "@/lib/time";
import type { Service, Staff } from "@/lib/types";

export default async function NewBooking({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { account, isOwner } = await requireMember();
  const [services, staff] = await Promise.all([
    query<Service>("SELECT * FROM services WHERE account_id = $1 AND active ORDER BY type, name", [account.id]),
    query<Staff>("SELECT * FROM staff WHERE account_id = $1 AND active ORDER BY role = 'owner' DESC, created_at", [account.id]),
  ]);
  const clientId = param(sp, "client");
  const client = clientId
    ? await one<{ name: string; phone_e164: string; email: string | null; sms_consent: boolean; dog: string | null }>(
        `SELECT c.name, c.phone_e164, c.email, c.sms_consent,
           (SELECT name FROM dogs WHERE client_id = c.id ORDER BY created_at LIMIT 1) AS dog
         FROM clients c WHERE c.id = $1 AND c.account_id = $2`,
        [clientId, account.id],
      )
    : null;

  if (services.length === 0) {
    return (
      <div className="card">
        <Empty title="Add a service first.">
          <p>Bookings are for a service, like a groom or a lesson.</p>
          {isOwner ? <Link href="/app/settings/services">Add a service →</Link> : <p>Ask the owner to add services.</p>}
        </Empty>
      </div>
    );
  }

  return (
    <>
      <h1>Add a booking</h1>
      <p className="muted small">For clients who call or text you. The 24-hour online rule doesn&apos;t apply here.</p>
      <Flash sp={sp} />
      <form action={addBooking} className="card">
        <label htmlFor="service">Service</label>
        <select id="service" name="service" required>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration_min} min, {money(s.price_cents)})
            </option>
          ))}
        </select>
        <div className="grid2">
          <div>
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" required defaultValue={addDaysYmd(ymdInTz(new Date(), account.timezone), 1)} />
          </div>
          <div>
            <label htmlFor="time">Start time</label>
            <input id="time" name="time" type="time" required defaultValue="10:00" step={300} />
          </div>
        </div>
        {staff.length > 1 ? (
          <>
            <label htmlFor="staff">With</label>
            <select id="staff" name="staff">
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <input type="hidden" name="staff" value={staff[0]?.id} />
        )}
        <h2>Client</h2>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required defaultValue={client?.name} />
        <label htmlFor="phone">Mobile number</label>
        <input id="phone" name="phone" type="tel" required defaultValue={client ? formatPhone(client.phone_e164) : ""} />
        <div className="hint">If this number is already a client, the booking attaches to them.</div>
        <label htmlFor="email">Email (optional)</label>
        <input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
        <div className="grid2">
          <div>
            <label htmlFor="dog_name">Dog&apos;s name</label>
            <input id="dog_name" name="dog_name" required defaultValue={client?.dog ?? ""} />
          </div>
          <div>
            <label htmlFor="dog_breed">Breed (optional)</label>
            <input id="dog_breed" name="dog_breed" />
          </div>
        </div>
        <label className="check" style={{ marginTop: 16 }}>
          <input type="checkbox" name="consent" defaultChecked={client?.sms_consent} />
          <span className="small">
            The client agreed to this: “{consentText(account.business_name)}”
          </span>
        </label>
        <button className="block">Add booking</button>
      </form>
    </>
  );
}
