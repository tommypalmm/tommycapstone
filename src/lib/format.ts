import { randomBytes } from "node:crypto";

export const APP_NAME = "PetPro OS";

export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** "$45" or "45.50" → cents. */
export function parseMoney(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").replace(/[$,\s]/g, "");
  if (s === "") return 0;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export function token(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");
}

export function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

export function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

/** Appends ?error= / ?ok= to a path for redirect-based form feedback. */
export function withMsg(path: string, kind: "error" | "ok", msg: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`;
}
