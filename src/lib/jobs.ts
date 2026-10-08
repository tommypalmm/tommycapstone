import { one, query } from "./db";
import { appUrl } from "./format";
import { sendSms } from "./sms";
import { formatDateTime } from "./time";
import type { Account } from "./types";

// Idempotent scheduled work. Each job is claimed atomically (FOR UPDATE SKIP
// LOCKED), so a reminder fires once even if two tickers overlap. Failed sends
// retry with backoff, then stay visible as "failed" on the dashboard.

const MAX_ATTEMPTS = 3;

interface JobRow {
  id: string;
  account_id: string;
  booking_id: string | null;
  client_id: string | null;
  kind: "confirmation" | "reminder" | "rebook" | "review" | "notes_link";
  attempts: number;
}

interface Ctx {
  account: Account;
  client: { id: string; name: string; phone_e164: string; sms_consent: boolean; sms_opted_out_at: Date | null };
  booking: {
    id: string;
    start_time: Date;
    status: string;
    manage_token: string;
    service_id: string;
    service: string;
    dog: string | null;
  } | null;
}

type Outcome = { status: "sent" | "skipped" | "cancelled"; reason?: string } | { status: "retry" | "failed"; reason: string };

async function loadCtx(job: JobRow): Promise<Ctx | null> {
  const account = await one<Account>("SELECT * FROM accounts WHERE id = $1", [job.account_id]);
  const client = await one<Ctx["client"]>("SELECT * FROM clients WHERE id = $1", [job.client_id]);
  if (!account || !client) return null;
  const booking = job.booking_id
    ? await one<NonNullable<Ctx["booking"]>>(
        `SELECT b.id, b.start_time, b.status, b.manage_token, b.service_id, s.name AS service, d.name AS dog
         FROM bookings b JOIN services s ON s.id = b.service_id LEFT JOIN dogs d ON d.id = b.dog_id WHERE b.id = $1`,
        [job.booking_id],
      )
    : null;
  return { account, client, booking };
}

function messageFor(job: JobRow, ctx: Ctx, extra: { notesToken?: string }): string | null {
  const { account, client, booking } = ctx;
  const biz = account.business_name;
  const base = appUrl();
  const dog = booking?.dog ?? "your dog";
  const when = booking ? formatDateTime(new Date(booking.start_time), account.timezone) : "";
  const manage = booking ? `${base}/c/${booking.manage_token}` : "";
  switch (job.kind) {
    case "confirmation":
      return `${biz}: You're booked! ${booking!.service} for ${dog} on ${when}. Change or cancel: ${manage}`;
    case "reminder":
      return `Reminder from ${biz}: ${booking!.service} for ${dog} on ${when}. Reply C to confirm or X to cancel. ${manage}`;
    case "review":
      return account.review_link
        ? `Thanks for visiting ${biz}, ${client.name.split(" ")[0]}! Would you leave us a quick review? ${account.review_link}`
        : null;
    case "rebook":
      return `Hi ${client.name.split(" ")[0]}, it's about time for ${dog}'s next ${booking!.service} at ${biz}. Book here: ${base}/book?b=${account.slug}&service=${booking!.service_id}&src=rebook`;
    case "notes_link":
      return extra.notesToken ? `${biz}: notes and homework from ${dog}'s session: ${base}/n/${extra.notesToken}` : null;
  }
}

async function handle(job: JobRow): Promise<Outcome> {
  const ctx = await loadCtx(job);
  if (!ctx) return { status: "cancelled", reason: "Client or account no longer exists" };
  const { account, client, booking } = ctx;
  if (account.status !== "active") return { status: "cancelled", reason: "Account closed" };
  // S4: no consent, no texts. STOP is honored.
  if (!client.sms_consent) return { status: "skipped", reason: "No SMS consent" };
  if (client.sms_opted_out_at) return { status: "skipped", reason: "Client replied STOP" };

  if (job.kind === "confirmation" || job.kind === "reminder") {
    if (!booking || booking.status !== "confirmed") return { status: "skipped", reason: "Booking no longer confirmed" };
  }
  if (job.kind === "rebook") {
    // Rebook suppression (open CP-M3 question): current rule = any future appointment for this client.
    const future = await one(
      "SELECT 1 FROM bookings WHERE client_id = $1 AND start_time > now() AND status IN ('pending','confirmed') LIMIT 1",
      [client.id],
    );
    if (future) return { status: "skipped", reason: "Client already has a future appointment" };
  }
  if (job.kind === "review") {
    // Decision #13: we can't verify a review was posted, so ask each client once.
    const asked = await one("SELECT 1 FROM jobs WHERE client_id = $1 AND kind = 'review' AND status = 'sent' LIMIT 1", [
      client.id,
    ]);
    if (asked) return { status: "skipped", reason: "Client was already asked for a review" };
  }
  let notesToken: string | undefined;
  if (job.kind === "notes_link") {
    const n = await one<{ share_token: string }>("SELECT share_token FROM session_notes WHERE booking_id = $1", [
      job.booking_id,
    ]);
    notesToken = n?.share_token;
  }

  const body = messageFor(job, ctx, { notesToken });
  if (!body) return { status: "skipped", reason: "Nothing to send" };
  const res = await sendSms({ account, to: client.phone_e164, body, clientId: client.id, jobId: job.id });
  if (res.ok) return { status: "sent" };
  return job.attempts >= MAX_ATTEMPTS ? { status: "failed", reason: res.error! } : { status: "retry", reason: res.error! };
}

/**
 * Whether this process may send scheduled texts. A laptop running `npm run dev` against the
 * production database must not: it would claim real jobs and only simulate the sends.
 * Allowed on Vercel, on the local embedded database, or when JOB_TICKER=on is set explicitly.
 */
export function jobsRunHere(): boolean {
  if (process.env.JOB_TICKER === "on") return true;
  return Boolean(process.env.VERCEL) || !process.env.DATABASE_URL;
}

let running = false;

export async function runDueJobs(): Promise<{ processed: number }> {
  if (running || !jobsRunHere()) return { processed: 0 };
  running = true;
  try {
    // Release jobs stuck in "running" (e.g. the process died mid-send).
    await query("UPDATE jobs SET status = 'pending', locked_at = NULL WHERE status = 'running' AND locked_at < now() - interval '10 minutes'");
    const due = await query<JobRow>(
      `UPDATE jobs SET status = 'running', attempts = attempts + 1, locked_at = now()
       WHERE id IN (SELECT id FROM jobs WHERE status = 'pending' AND run_at <= now() ORDER BY run_at LIMIT 25 FOR UPDATE SKIP LOCKED)
       RETURNING id, account_id, booking_id, client_id, kind, attempts`,
    );
    for (const job of due) {
      let out: Outcome;
      try {
        out = await handle(job);
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        out = job.attempts >= MAX_ATTEMPTS ? { status: "failed", reason } : { status: "retry", reason };
        console.error(`[jobs] ${job.kind} ${job.id} errored:`, e);
      }
      if (out.status === "retry") {
        await query(
          "UPDATE jobs SET status = 'pending', locked_at = NULL, last_error = $2, run_at = now() + ($3 || ' minutes')::interval WHERE id = $1",
          [job.id, out.reason, String(5 * job.attempts)],
        );
      } else {
        await query(
          `UPDATE jobs SET status = $2, last_error = $3, done_at = now(), locked_at = NULL,
             outcome = CASE WHEN kind = 'reminder' AND $2 = 'sent' THEN COALESCE(outcome, 'none') ELSE outcome END
           WHERE id = $1`,
          [job.id, out.status, out.reason ?? null],
        );
        if (out.status === "failed") console.error(`[jobs] ${job.kind} ${job.id} failed: ${out.reason}`);
      }
    }
    return { processed: due.length };
  } finally {
    running = false;
  }
}
