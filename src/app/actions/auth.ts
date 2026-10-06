"use server";

import { redirect } from "next/navigation";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { one, tx } from "@/lib/db";
import { str, token, withMsg } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { isValidTimeZone } from "@/lib/time";

function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "business";
  return `${base}-${token(3).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
}

export async function signup(form: FormData) {
  const businessName = str(form.get("business_name"));
  const ownerName = str(form.get("owner_name"));
  const email = str(form.get("email")).toLowerCase();
  const password = str(form.get("password"));
  const phoneRaw = str(form.get("phone"));
  const timezone = str(form.get("timezone")) || "America/New_York";

  const fail = (m: string) => redirect(withMsg("/signup", "error", m));
  if (!businessName || !ownerName) fail("Please enter your business name and your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("Please enter a valid email.");
  if (password.length < 8) fail("Password must be at least 8 characters.");
  if (!isValidTimeZone(timezone)) fail("Please pick a valid time zone.");
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) fail("Please enter a valid mobile number, or leave it blank.");
  if (await one("SELECT 1 FROM users WHERE email = $1", [email])) fail("An account with that email already exists. Log in instead.");

  const hash = await hashPassword(password);
  const userId = await tx(async (q) => {
    const [user] = await q.query<{ id: string }>("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id", [
      email,
      hash,
    ]);
    const [account] = await q.query<{ id: string }>(
      `INSERT INTO accounts (slug, business_name, owner_name, email, phone, timezone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [slugify(businessName), businessName, ownerName, email, phone, timezone],
    );
    await q.query("INSERT INTO staff (account_id, user_id, name, role) VALUES ($1, $2, $3, 'owner')", [
      account.id,
      user.id,
      ownerName,
    ]);
    return user.id;
  });
  await startSession(userId);
  redirect("/app");
}

export async function login(form: FormData) {
  const email = str(form.get("email")).toLowerCase();
  const password = str(form.get("password"));
  const user = await one<{ id: string; password_hash: string }>("SELECT id, password_hash FROM users WHERE email = $1", [email]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    redirect(withMsg("/login", "error", "That email and password don't match."));
  }
  const staff = await one("SELECT 1 FROM staff WHERE user_id = $1 AND active", [user.id]);
  if (!staff) redirect(withMsg("/login", "error", "This login has been deactivated. Ask the business owner."));
  await startSession(user.id);
  redirect("/app");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
