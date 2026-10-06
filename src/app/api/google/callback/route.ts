import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { currentMember } from "@/lib/auth";
import { connectGoogle } from "@/lib/calendar";
import { one } from "@/lib/db";
import { appUrl } from "@/lib/format";

export async function GET(req: NextRequest) {
  const back = (kind: "ok" | "error", msg: string) =>
    NextResponse.redirect(`${appUrl()}/app/settings/staff?${kind}=${encodeURIComponent(msg)}`);
  const m = await currentMember();
  if (!m?.isOwner) return NextResponse.redirect(`${appUrl()}/login`);

  const jar = await cookies();
  const [nonce, staffId] = (jar.get("pp_gstate")?.value ?? "").split(".");
  jar.delete({ name: "pp_gstate", path: "/api/google" });
  const code = req.nextUrl.searchParams.get("code");
  if (req.nextUrl.searchParams.get("error")) return back("error", "Google Calendar wasn't connected.");
  if (!code || !nonce || req.nextUrl.searchParams.get("state") !== nonce) return back("error", "That link expired. Try connecting again.");
  if (!(await one("SELECT 1 FROM staff WHERE id = $1 AND account_id = $2", [staffId, m.account.id]))) {
    return back("error", "Staff member not found.");
  }
  try {
    await connectGoogle(staffId, code);
  } catch (e) {
    return back("error", `Google Calendar couldn't connect: ${e instanceof Error ? e.message : "unknown error"}`);
  }
  return back("ok", "Google Calendar connected.");
}
