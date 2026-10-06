import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { currentMember } from "@/lib/auth";
import { googleAuthUrl, googleConfigured } from "@/lib/calendar";
import { one } from "@/lib/db";
import { appUrl, token } from "@/lib/format";

export async function GET(req: NextRequest) {
  const m = await currentMember();
  if (!m?.isOwner) return NextResponse.redirect(`${appUrl()}/login`);
  const staffId = req.nextUrl.searchParams.get("staff") ?? "";
  const staff = await one("SELECT 1 FROM staff WHERE id = $1 AND account_id = $2", [staffId, m.account.id]);
  if (!googleConfigured() || !staff) {
    return NextResponse.redirect(`${appUrl()}/app/settings/staff?error=${encodeURIComponent("Google Calendar isn't available.")}`);
  }
  const nonce = token(16);
  (await cookies()).set("pp_gstate", `${nonce}.${staffId}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/google",
    maxAge: 600,
  });
  return NextResponse.redirect(googleAuthUrl(nonce));
}
