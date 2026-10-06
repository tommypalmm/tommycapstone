import { revalidatePath } from "next/cache";
import { Empty, StatusTag } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { query } from "@/lib/db";
import { str } from "@/lib/format";
import { handleInbound } from "@/lib/inbound";
import { formatPhone } from "@/lib/phone";
import { twilioConfigured } from "@/lib/sms";
import { formatDateTime } from "@/lib/time";

// Lets you try keyword replies (C, X, STOP, START, anything else) while texting is simulated.
async function simulateReply(form: FormData) {
  "use server";
  const { account } = await requireMember();
  if (twilioConfigured() && account.twilio_from_number) return;
  await handleInbound(
    { From: str(form.get("from")), To: account.twilio_from_number ?? "", Body: str(form.get("body")) },
    account,
  );
  revalidatePath("/app/messages");
}

export default async function MessagesPage() {
  const { account } = await requireMember();
  const clients = await query<{ name: string; phone_e164: string }>(
    "SELECT name, phone_e164 FROM clients WHERE account_id = $1 ORDER BY name LIMIT 100",
    [account.id],
  );
  const rows = await query<{
    id: string;
    direction: string;
    to_number: string | null;
    from_number: string | null;
    body: string;
    status: string;
    error: string | null;
    created_at: Date;
    client_name: string | null;
  }>(
    `SELECT l.*, c.name AS client_name FROM sms_log l LEFT JOIN clients c ON c.id = l.client_id
     WHERE l.account_id = $1 ORDER BY l.created_at DESC LIMIT 200`,
    [account.id],
  );
  const live = twilioConfigured() && Boolean(account.twilio_from_number);
  return (
    <>
      <h1>Texts</h1>
      {!live && (
        <div className="msg warn small">
          Texting is in <strong>simulated</strong> mode: messages are logged here but not delivered. Connect Twilio in
          Settings to send for real.
        </div>
      )}
      {!live && clients.length > 0 && (
        <form action={simulateReply} className="card">
          <h2 style={{ marginTop: 0 }}>Simulate a client reply</h2>
          <div className="grid2">
            <div>
              <label htmlFor="from">From</label>
              <select id="from" name="from">
                {clients.map((c) => (
                  <option key={c.phone_e164} value={c.phone_e164}>
                    {c.name} ({formatPhone(c.phone_e164)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="body">Message</label>
              <input id="body" name="body" required placeholder="C, X, STOP, START, or anything" />
            </div>
          </div>
          <button className="block secondary">Send as client</button>
        </form>
      )}
      <div className="card">
        {rows.length === 0 ? (
          <Empty title="No texts yet.">
            <p>Confirmations, reminders, rebooking nudges, review requests, and client replies all show up here.</p>
          </Empty>
        ) : (
          <ul className="list">
            {rows.map((r) => (
              <li key={r.id}>
                <div className="spread small">
                  <span>
                    {r.direction === "in" ? "From" : "To"}{" "}
                    <strong>
                      {r.client_name ?? formatPhone((r.direction === "in" ? r.from_number : r.to_number) ?? "")}
                    </strong>
                  </span>
                  <span className="muted">
                    {formatDateTime(new Date(r.created_at), account.timezone)} <StatusTag status={r.status} />
                  </span>
                </div>
                <div>{r.body}</div>
                {r.error && <div className="small" style={{ color: "var(--danger)" }}>{r.error}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
