import Link from "next/link";
import { addStaff, deactivateStaff, disconnectCalendar, saveStaffSchedule } from "@/app/actions/settings";
import { HoursFields } from "@/components/HoursFields";
import { Flash, type SearchParams } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { googleConfigured } from "@/lib/calendar";
import { query } from "@/lib/db";
import { hasFeature, maxStaff } from "@/lib/plans";
import type { Staff } from "@/lib/types";

type StaffRow = Staff & { email: string | null; sync_state: string | null; last_error: string | null };

export default async function StaffPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { account } = await requireOwner();
  const staff = await query<StaffRow>(
    `SELECT st.*, u.email, cc.sync_state, cc.last_error FROM staff st
     LEFT JOIN users u ON u.id = st.user_id LEFT JOIN calendar_connections cc ON cc.staff_id = st.id
     WHERE st.account_id = $1 AND st.active ORDER BY st.role = 'owner' DESC, st.created_at`,
    [account.id],
  );
  const canAdd = hasFeature(account.plan, "multi_staff") && staff.length < maxStaff(account.plan);
  const google = googleConfigured();

  return (
    <>
      <p>
        <Link href="/app/settings">← Settings</Link>
      </p>
      <h1>Staff &amp; calendars</h1>
      <Flash sp={sp} />
      {!google && (
        <div className="msg warn small">
          Google Calendar isn&apos;t configured on this server yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Until then,
          availability comes from hours and existing bookings only.
        </div>
      )}
      {staff.map((s) => (
        <div className="card" key={s.id}>
          <div className="spread">
            <h2 style={{ margin: 0 }}>{s.name}</h2>
            <span className="tag">{s.role}</span>
          </div>
          <p className="muted small">{s.email ? `Login: ${s.email}` : "No login (schedule only)"}</p>

          <h3>Google Calendar</h3>
          {s.sync_state ? (
            <div className="row">
              <span className={`tag ${s.sync_state === "ok" ? "confirmed" : "failed"}`}>
                {s.sync_state === "ok" ? "connected" : "error"}
              </span>
              {s.last_error && <span className="small">{s.last_error}</span>}
              {google && (
                <a className="btn secondary" href={`/api/google/connect?staff=${s.id}`}>
                  Reconnect
                </a>
              )}
              <form action={disconnectCalendar} className="inline">
                <input type="hidden" name="staff_id" value={s.id} />
                <button className="secondary">Disconnect</button>
              </form>
            </div>
          ) : google ? (
            <a className="btn secondary" href={`/api/google/connect?staff=${s.id}`}>
              Connect Google Calendar
            </a>
          ) : (
            <p className="muted small">Not connected.</p>
          )}
          <p className="hint">
            Busy times on this calendar are hidden from clients, and new bookings are added to it. No Google account? Create one
            free at calendar.google.com, then connect it.
          </p>

          <form action={saveStaffSchedule}>
            <input type="hidden" name="id" value={s.id} />
            <h3>Schedule</h3>
            <label className="check">
              <input type="checkbox" name="own_hours" defaultChecked={Boolean(s.working_hours)} />
              Use their own hours (otherwise business hours)
            </label>
            <HoursFields hours={s.working_hours ?? account.operating_hours} prefix={`s${s.id}_`} />
            <label htmlFor={`buf-${s.id}`}>Buffer override (minutes, blank = business default)</label>
            <input id={`buf-${s.id}`} name="buffer_minutes" type="number" min={0} max={240} defaultValue={s.buffer_minutes ?? ""} />
            <button className="block">Save schedule</button>
          </form>
          {s.role !== "owner" && (
            <form action={deactivateStaff} style={{ marginTop: 8 }}>
              <input type="hidden" name="id" value={s.id} />
              <button className="danger">Deactivate {s.name}</button>
            </form>
          )}
        </div>
      ))}

      {canAdd ? (
        <form action={addStaff} className="card">
          <h2 style={{ marginTop: 0 }}>Add staff</h2>
          <p className="muted small">Staff can see calendars and edit bookings. They can&apos;t change business settings.</p>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required />
          <label htmlFor="email">Login email (optional)</label>
          <input id="email" name="email" type="email" autoComplete="off" />
          <label htmlFor="password">Temporary password (optional)</label>
          <input id="password" name="password" type="text" minLength={8} autoComplete="off" />
          <button className="block">Add staff member</button>
        </form>
      ) : (
        <p className="muted small">Your plan&apos;s staff limit is reached.</p>
      )}
    </>
  );
}
