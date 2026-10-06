import { cancelBooking } from "./bookings";
import { one, query } from "./db";
import { appUrl } from "./format";
import { normalizePhone } from "./phone";
import { accountForInbound, sendSms } from "./sms";
import { formatDateTime } from "./time";
import type { Account, Booking } from "./types";

// Inbound SMS handling. Keywords (Decision #8): C = confirm, X = cancel,
// STOP = opt out, START = opt back in. Anything else gets one fallback that
// points to a human. Every inbound message is logged.
//
// CANCEL is a Twilio/carrier opt-out keyword, so it's treated like STOP; we
// use X for "cancel my appointment" to avoid unsubscribing people by accident.

const OPT_OUT = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "OPTOUT", "REVOKE"];
const OPT_IN = ["START", "UNSTOP", "YES START"];
const CONFIRM = ["C", "CONFIRM", "Y", "YES"];
const CANCEL_APPT = ["X", "CANCEL APPT", "CANCEL APPOINTMENT"];

/** `forceAccount` is used by the in-app reply simulator; the webhook resolves the account from the To number. */
export async function handleInbound(params: Record<string, string>, forceAccount?: Account): Promise<void> {
  const from = normalizePhone(params.From ?? "");
  const to = normalizePhone(params.To ?? "") ?? params.To ?? "";
  const body = (params.Body ?? "").trim();
  if (!from) return;
  const account = forceAccount ?? (await accountForInbound(to, from));
  if (!account) return;

  const client = await one<{ id: string; name: string; sms_opted_out_at: Date | null }>(
    "SELECT id, name, sms_opted_out_at FROM clients WHERE account_id = $1 AND phone_e164 = $2",
    [account.id, from],
  );
  await query(
    `INSERT INTO sms_log (account_id, client_id, direction, to_number, from_number, body, status, provider_id)
     VALUES ($1, $2, 'in', $3, $4, $5, 'received', $6)`,
    [account.id, client?.id ?? null, to, from, body, params.MessageSid ?? null],
  );
  if (!client) return;

  const word = body.toUpperCase().replace(/[^A-Z ]/g, "").trim();
  const reply = (text: string) => sendSms({ account, to: from, body: text, clientId: client.id });

  if (OPT_OUT.includes(word)) {
    await query("UPDATE clients SET sms_opted_out_at = now() WHERE id = $1", [client.id]);
    return; // the carrier/Twilio sends the opt-out confirmation
  }
  if (OPT_IN.includes(word)) {
    await query("UPDATE clients SET sms_opted_out_at = NULL, sms_consent = true, sms_consent_at = now(), sms_consent_text = $2 WHERE id = $1", [
      client.id,
      `Replied ${word} by SMS`,
    ]);
    await reply(`${account.business_name}: You're opted back in to appointment texts. Reply STOP to opt out.`);
    return;
  }
  if (client.sms_opted_out_at) return;

  const next = await one<Booking & { service: string }>(
    `SELECT b.*, s.name AS service FROM bookings b JOIN services s ON s.id = b.service_id
     WHERE b.client_id = $1 AND b.start_time > now() AND b.status IN ('pending','confirmed')
     ORDER BY b.start_time LIMIT 1`,
    [client.id],
  );
  const when = next ? formatDateTime(new Date(next.start_time), account.timezone) : "";

  if (CONFIRM.includes(word) && next) {
    await query("UPDATE jobs SET outcome = 'confirmed' WHERE booking_id = $1 AND kind = 'reminder'", [next.id]);
    await reply(`${account.business_name}: Thanks, you're confirmed for ${next.service} on ${when}. See you then!`);
    return;
  }
  if (CANCEL_APPT.includes(word) && next) {
    const hoursOut = (new Date(next.start_time).getTime() - Date.now()) / 3600_000;
    if (hoursOut < account.cancel_cutoff_hours) {
      await reply(
        `${account.business_name}: Online cancellations close ${account.cancel_cutoff_hours}h before your appointment. Please contact us directly${contactPath(account)}.`,
      );
      return;
    }
    await cancelBooking(next, "client");
    await reply(`${account.business_name}: Your ${next.service} on ${when} is cancelled. Book again anytime: ${appUrl()}/book?b=${account.slug}`);
    return;
  }

  // Unrecognized: one fallback to a human contact path, logged like any other reply.
  if (next) {
    await query("UPDATE jobs SET outcome = COALESCE(outcome, 'fallback') WHERE booking_id = $1 AND kind = 'reminder' AND outcome IS DISTINCT FROM 'confirmed'", [next.id]);
  }
  await reply(
    `${account.business_name}: This number sends automated appointment texts${next ? ". Reply C to confirm or X to cancel" : ""}. To reach a person${contactPath(account) || " please contact the business directly"}.`,
  );
  return;
}

function contactPath(account: Account): string {
  if (account.contact_link) return `: ${account.contact_link}`;
  if (account.phone) return ` call ${account.phone}`;
  return "";
}
