import { NextResponse, type NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth";
import { query } from "@/lib/db";

// CSV export, available anytime and after closing the account (Decision #28).
const EXPORTS: Record<string, string> = {
  clients: `SELECT name, phone_e164 AS phone, email, sms_consent, sms_consent_at, sms_consent_text, sms_opted_out_at, created_at
            FROM clients WHERE account_id = $1 ORDER BY name`,
  dogs: `SELECT c.name AS client, c.phone_e164 AS client_phone, d.name, d.breed, d.size, d.notes, d.created_at
         FROM dogs d JOIN clients c ON c.id = d.client_id WHERE c.account_id = $1 ORDER BY c.name, d.name`,
  bookings: `SELECT b.start_time, b.end_time, b.status, b.source, b.price_cents / 100.0 AS price, s.name AS service,
               st.name AS staff, c.name AS client, c.phone_e164 AS client_phone, d.name AS dog, n.notes, n.homework, b.created_at
             FROM bookings b JOIN services s ON s.id = b.service_id JOIN staff st ON st.id = b.staff_id
             JOIN clients c ON c.id = b.client_id LEFT JOIN dogs d ON d.id = b.dog_id LEFT JOIN session_notes n ON n.booking_id = b.id
             WHERE b.account_id = $1 ORDER BY b.start_time`,
  services: `SELECT name, type, size_tier, duration_min, price_cents / 100.0 AS price, deposit_cents / 100.0 AS deposit,
               rebook_cycle_days, active FROM services WHERE account_id = $1 ORDER BY name`,
  texts: `SELECT l.created_at, l.direction, l.to_number, l.from_number, l.body, l.status, l.error, c.name AS client
          FROM sms_log l LEFT JOIN clients c ON c.id = l.client_id WHERE l.account_id = $1 ORDER BY l.created_at`,
};

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const { account } = await requireOwner();
  const table = req.nextUrl.searchParams.get("table") ?? "";
  const sql = EXPORTS[table];
  if (!sql) return new NextResponse("Unknown export", { status: 404 });
  const rows = await query(sql, [account.id]);
  const cols = rows.length ? Object.keys(rows[0]) : [];
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${account.slug}-${table}.csv"`,
    },
  });
}
