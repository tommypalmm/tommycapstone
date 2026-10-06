import Link from "next/link";
import {
  closeAccount,
  saveBusiness,
  saveEssentials,
  saveIntegrations,
  savePolicies,
} from "@/app/actions/settings";
import { HoursFields } from "@/components/HoursFields";
import { TimeZoneSelect } from "@/components/TimeZoneSelect";
import { Flash, type SearchParams } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { goLiveIssues } from "@/lib/availability";
import { query } from "@/lib/db";
import { appUrl } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { PLANS } from "@/lib/plans";
import { twilioConfigured } from "@/lib/sms";
import type { Service } from "@/lib/types";

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { account } = await requireOwner();
  const services = await query<Service>("SELECT * FROM services WHERE account_id = $1", [account.id]);
  const issues = goLiveIssues(account, services);
  const base = appUrl();
  const link = `${base}/book?b=${account.slug}`;
  const snippet = `<script src="${base}/embed.js" data-business="${account.slug}" async></script>`;
  const closed = account.status !== "active";

  return (
    <>
      <h1>Settings</h1>
      <Flash sp={sp} />
      <div className="row">
        <Link className="btn secondary" href="/app/settings/services">
          Services ({services.filter((s) => s.active).length})
        </Link>
        <Link className="btn secondary" href="/app/settings/staff">
          Staff &amp; calendars
        </Link>
      </div>

      <div className={`msg ${issues.length ? "warn" : "ok"}`}>
        {issues.length ? (
          <>
            <strong>Before your booking page goes live:</strong>
            <ul style={{ margin: "6px 0" }}>
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </>
        ) : (
          <strong>Your booking page is live.</strong>
        )}
      </div>

      <form action={saveEssentials} className="card">
        <h2 style={{ marginTop: 0 }}>Hours &amp; scheduling</h2>
        <p className="muted small">Required to go live. Staff use these hours unless you give them their own.</p>
        <HoursFields hours={account.operating_hours} />
        <div className="grid2">
          <div>
            <label htmlFor="booking_interval_min">Booking interval (minutes)</label>
            <input
              id="booking_interval_min"
              name="booking_interval_min"
              type="number"
              min={5}
              max={480}
              defaultValue={account.booking_interval_min ?? 30}
              required
            />
            <div className="hint">How often a start time is offered, e.g. every 30 minutes.</div>
          </div>
          <div>
            <label htmlFor="buffer_minutes">Buffer between bookings (minutes)</label>
            <input id="buffer_minutes" name="buffer_minutes" type="number" min={0} max={240} defaultValue={account.buffer_minutes} />
          </div>
        </div>
        <label htmlFor="timezone">Time zone</label>
        <TimeZoneSelect name="timezone" value={account.timezone} />
        <button className="block">Save hours</button>
      </form>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Your booking link</h2>
        {issues.length ? (
          <p className="muted">Available once setup is complete.</p>
        ) : (
          <>
            <p>
              Share this anywhere (Instagram bio, Google profile, texts): <a href={link}>{link}</a>
            </p>
            <p>
              <strong>Embed on your website:</strong> paste this where the booking form should appear.
            </p>
            <pre className="code">{snippet}</pre>
            <p className="muted small">Add ?src=meta to links in Meta ads so those bookings are credited to ads.</p>
          </>
        )}
      </div>

      <form action={saveBusiness} className="card">
        <h2 style={{ marginTop: 0 }}>Business details</h2>
        <label htmlFor="business_name">Business name</label>
        <input id="business_name" name="business_name" defaultValue={account.business_name} required />
        <label htmlFor="owner_name">Your name</label>
        <input id="owner_name" name="owner_name" defaultValue={account.owner_name} />
        <label htmlFor="phone">Your mobile (for cancellation alerts)</label>
        <input id="phone" name="phone" type="tel" defaultValue={account.phone ? formatPhone(account.phone) : ""} />
        <label htmlFor="contact_link">How clients reach a person</label>
        <input id="contact_link" name="contact_link" defaultValue={account.contact_link ?? ""} placeholder="yourwebsite.com/contact" />
        <div className="hint">Sent when a client texts something the system doesn&apos;t understand.</div>
        <label htmlFor="review_link">Review link</label>
        <input id="review_link" name="review_link" defaultValue={account.review_link ?? ""} placeholder="g.page/r/your-business/review" />
        <div className="hint">Clients get this after a completed visit. Leave blank to turn off review requests.</div>
        <label htmlFor="meta_pixel_id">Meta Pixel ID (optional)</label>
        <input id="meta_pixel_id" name="meta_pixel_id" inputMode="numeric" defaultValue={account.meta_pixel_id ?? ""} />
        <button className="block">Save details</button>
      </form>

      <form action={savePolicies} className="card">
        <h2 style={{ marginTop: 0 }}>Your policies</h2>
        <p className="muted small">Your rules, shown to clients when they book and enforced by the system.</p>
        <div className="grid2">
          <div>
            <label htmlFor="cancel_cutoff_hours">Clients can cancel online up to (hours before)</label>
            <input id="cancel_cutoff_hours" name="cancel_cutoff_hours" type="number" min={0} max={168} defaultValue={account.cancel_cutoff_hours} />
          </div>
          <div>
            <label htmlFor="default_rebook_days">Default rebook reminder (days after visit)</label>
            <input id="default_rebook_days" name="default_rebook_days" type="number" min={1} max={365} defaultValue={account.default_rebook_days ?? ""} />
            <div className="hint">Used when a service has no cycle of its own. Blank = off.</div>
          </div>
        </div>
        <label htmlFor="cancellation_policy">Cancellation policy</label>
        <textarea id="cancellation_policy" name="cancellation_policy" defaultValue={account.cancellation_policy ?? ""} />
        <label htmlFor="deposit_policy">Deposit policy</label>
        <textarea id="deposit_policy" name="deposit_policy" defaultValue={account.deposit_policy ?? ""} />
        <label htmlFor="refund_policy">Refund policy</label>
        <textarea id="refund_policy" name="refund_policy" defaultValue={account.refund_policy ?? ""} />
        <button className="block">Save policies</button>
      </form>

      <form action={saveIntegrations} className="card">
        <h2 style={{ marginTop: 0 }}>Texting &amp; payments</h2>
        <p className="small">
          Texting:{" "}
          {twilioConfigured() && account.twilio_from_number ? (
            <strong>live via Twilio</strong>
          ) : (
            <strong>simulated</strong>
          )}
          {!(twilioConfigured() && account.twilio_from_number) && (
            <span className="muted"> (texts are logged under Texts but not delivered until Twilio is set up)</span>
          )}
        </p>
        <div className="grid2">
          <div>
            <label htmlFor="twilio_subaccount_sid">Twilio subaccount SID</label>
            <input id="twilio_subaccount_sid" name="twilio_subaccount_sid" defaultValue={account.twilio_subaccount_sid ?? ""} />
          </div>
          <div>
            <label htmlFor="twilio_from_number">Texting number</label>
            <input id="twilio_from_number" name="twilio_from_number" type="tel" defaultValue={account.twilio_from_number ?? ""} />
          </div>
        </div>
        <label htmlFor="processor">Client payments processor</label>
        <select id="processor" name="processor" defaultValue={account.processor ?? ""}>
          <option value="">None yet</option>
          <option value="stripe">Stripe</option>
          <option value="square">Square</option>
        </select>
        <div className="hint">
          Deposits and packages aren&apos;t collected online yet. This is separate from your {PLANS[account.plan]?.label ?? ""}{" "}
          subscription.
        </div>
        <button className="block">Save</button>
      </form>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Your data</h2>
        <p>Download a CSV anytime.</p>
        <div className="row">
          {["clients", "dogs", "bookings", "services", "texts"].map((t) => (
            <a key={t} className="btn secondary" href={`/app/export?table=${t}`}>
              {t}.csv
            </a>
          ))}
        </div>
      </div>

      {!closed && (
        <form action={closeAccount} className="card">
          <h2 style={{ marginTop: 0 }}>Close account</h2>
          <p className="small">
            Takes your booking page offline, cancels all upcoming bookings (clients who opted in get a text), and stops all
            scheduled texts. You can still log in to export your data.
          </p>
          <label htmlFor="confirm">Type “{account.business_name}” to confirm</label>
          <input id="confirm" name="confirm" autoComplete="off" />
          <button className="danger block">Close my account</button>
        </form>
      )}
    </>
  );
}
