import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Session notes" };

// Private, no-login link to a session's notes and homework (S7). Expiry/revocation is undecided (Decision #26).
export default async function NotesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const n = await one<{
    notes: string | null;
    homework: string | null;
    start_time: Date;
    service: string;
    dog: string | null;
    business_name: string;
    timezone: string;
  }>(
    `SELECT n.notes, n.homework, b.start_time, s.name AS service, d.name AS dog, a.business_name, a.timezone
     FROM session_notes n JOIN bookings b ON b.id = n.booking_id JOIN services s ON s.id = b.service_id
     JOIN accounts a ON a.id = b.account_id LEFT JOIN dogs d ON d.id = b.dog_id
     WHERE n.share_token = $1`,
    [token],
  );
  if (!n) notFound();
  const empty = !n.notes?.trim() && !n.homework?.trim();
  return (
    <main className="wrap narrow">
      <h1 style={{ marginTop: 16 }}>{n.business_name}</h1>
      <p className="muted">
        {n.service}
        {n.dog && ` · ${n.dog}`} · {formatDateTime(new Date(n.start_time), n.timezone)}
      </p>
      {empty ? (
        <div className="card empty">
          <strong>No notes yet.</strong>
          <p>Your trainer hasn&apos;t added notes for this session. Check back later.</p>
        </div>
      ) : (
        <>
          {n.notes?.trim() && (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Session notes</h2>
              <p style={{ whiteSpace: "pre-wrap" }}>{n.notes}</p>
            </div>
          )}
          {n.homework?.trim() && (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Homework</h2>
              <p style={{ whiteSpace: "pre-wrap" }}>{n.homework}</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
