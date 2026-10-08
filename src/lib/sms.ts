import { createHmac, timingSafeEqual } from "node:crypto";
import { one, query } from "./db";
import type { Account } from "./types";

// SMS goes out through the owner's Twilio subaccount under one brand/campaign
// (Decision #24). Without Twilio credentials the send is simulated and only
// logged, so the full flow works locally without texting real people.

export function twilioConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

interface SendArgs {
  account: Account;
  to: string;
  body: string;
  clientId?: string | null;
  jobId?: string | null;
}

export interface SendResult {
  ok: boolean;
  status: "sent" | "simulated" | "failed";
  error?: string;
}

export async function sendSms({ account, to, body, clientId, jobId }: SendArgs): Promise<SendResult> {
  let result: SendResult;
  let providerId: string | null = null;

  if (!twilioConfigured() || !account.twilio_from_number) {
    result = { ok: true, status: "simulated" };
  } else {
    const master = process.env.TWILIO_ACCOUNT_SID!;
    const sid = account.twilio_subaccount_sid || master;
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${master}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: account.twilio_from_number, Body: body }),
      });
      const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (res.ok) {
        providerId = data.sid ?? null;
        result = { ok: true, status: "sent" };
      } else {
        result = { ok: false, status: "failed", error: data.message ?? `Twilio HTTP ${res.status}` };
      }
    } catch (e) {
      result = { ok: false, status: "failed", error: e instanceof Error ? e.message : String(e) };
    }
  }

  await query(
    `INSERT INTO sms_log (account_id, client_id, job_id, direction, to_number, from_number, body, status, provider_id, error)
     VALUES ($1, $2, $3, 'out', $4, $5, $6, $7, $8, $9)`,
    [account.id, clientId ?? null, jobId ?? null, to, account.twilio_from_number, body, result.status, providerId, result.error ?? null],
  );
  if (result.status === "simulated") console.log(`[sms simulated] to ${to}: ${body}`);
  return result;
}

/**
 * Validates X-Twilio-Signature (HMAC-SHA1 of URL + sorted params). Twilio signs with the auth token of
 * the account that owns the number, so a reply to an owner's subaccount number is checked against
 * that subaccount's token, never the master's (Decision #24).
 */
export async function validTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
): Promise<boolean> {
  if (!twilioConfigured()) return true; // simulated mode: nothing to validate against
  if (!signature) return false;
  const authToken = await authTokenFor(params.AccountSid);
  if (!authToken) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

const subaccountTokens = new Map<string, string>();

/** The master token, or a known owner subaccount's token (fetched once from Twilio, then cached). */
async function authTokenFor(accountSid: string | undefined): Promise<string | null> {
  const master = process.env.TWILIO_ACCOUNT_SID!;
  if (!accountSid || accountSid === master) return process.env.TWILIO_AUTH_TOKEN!;
  // Only subaccounts an owner has configured are trusted.
  if (!(await one("SELECT 1 FROM accounts WHERE twilio_subaccount_sid = $1", [accountSid]))) return null;
  const cached = subaccountTokens.get(accountSid);
  if (cached) return cached;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
    headers: { Authorization: "Basic " + Buffer.from(`${master}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64") },
  });
  if (!res.ok) return null;
  const token = ((await res.json()) as { auth_token?: string }).auth_token;
  if (!token) return null;
  subaccountTokens.set(accountSid, token);
  return token;
}

export async function accountForInbound(toNumber: string, fromE164: string): Promise<Account | null> {
  const byNumber = await one<Account>("SELECT * FROM accounts WHERE twilio_from_number = $1", [toNumber]);
  if (byNumber) return byNumber;
  // Simulated/local mode: fall back to the account this phone most recently booked with.
  return one<Account>(
    `SELECT a.* FROM accounts a JOIN clients c ON c.account_id = a.id
     WHERE c.phone_e164 = $1 ORDER BY c.created_at DESC LIMIT 1`,
    [fromE164],
  );
}
