import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, query } from "./db";
import { token } from "./format";
import type { Account, Staff } from "./types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "pp_session";
const SESSION_DAYS = 30;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = await scrypt(pw, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return expected.length === hash.length && timingSafeEqual(expected, hash);
}

export async function startSession(userId: string) {
  const t = token(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [t, userId, expires]);
  (await cookies()).set(COOKIE, t, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await query("DELETE FROM sessions WHERE token = $1", [t]);
  jar.delete(COOKIE);
}

export interface Member {
  userId: string;
  email: string;
  staff: Staff;
  account: Account;
  isOwner: boolean;
}

export async function currentMember(): Promise<Member | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const row = await one<{ user_id: string; email: string }>(
    `SELECT s.user_id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > now()`,
    [t],
  );
  if (!row) return null;
  const staff = await one<Staff>("SELECT * FROM staff WHERE user_id = $1 AND active", [row.user_id]);
  if (!staff) return null;
  const account = await one<Account>("SELECT * FROM accounts WHERE id = $1", [staff.account_id]);
  if (!account) return null;
  return { userId: row.user_id, email: row.email, staff, account, isOwner: staff.role === "owner" };
}

/** Any logged-in owner or staff member. */
export async function requireMember(): Promise<Member> {
  const m = await currentMember();
  if (!m) redirect("/login");
  return m;
}

/** Business settings are owner-only, enforced here on the server, not just hidden in the UI. */
export async function requireOwner(): Promise<Member> {
  const m = await requireMember();
  if (!m.isOwner) redirect("/app?error=" + encodeURIComponent("Only the owner can change business settings."));
  return m;
}
