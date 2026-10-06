import type { NextRequest } from "next/server";
import { appUrl } from "@/lib/format";
import { handleInbound } from "@/lib/inbound";
import { validTwilioSignature } from "@/lib/sms";

// Twilio inbound SMS webhook. Point each owner's number here: ${APP_URL}/api/sms/inbound
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => (params[k] = String(v)));
  if (!validTwilioSignature(`${appUrl()}/api/sms/inbound`, params, req.headers.get("x-twilio-signature"))) {
    return new Response("invalid signature", { status: 403 });
  }
  await handleInbound(params);
  return new Response(EMPTY_TWIML, { headers: { "Content-Type": "text/xml" } });
}
