import Link from "next/link";
import { Empty, param, type SearchParams } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatPhone } from "@/lib/phone";

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (param(sp, "q") ?? "").trim();
  const { account } = await requireMember();
  const rows = await query<{ id: string; name: string; phone_e164: string; dogs: string | null; visits: string; next: Date | null }>(
    `SELECT c.id, c.name, c.phone_e164,
       (SELECT string_agg(name, ', ') FROM dogs WHERE client_id = c.id) AS dogs,
       (SELECT count(*) FROM bookings WHERE client_id = c.id AND status = 'completed') AS visits,
       (SELECT min(start_time) FROM bookings WHERE client_id = c.id AND start_time > now() AND status IN ('pending','confirmed')) AS next
     FROM clients c
     WHERE c.account_id = $1 AND ($2::text = '' OR c.name ILIKE '%' || $2 || '%'
       OR (length($3::text) >= 3 AND c.phone_e164 LIKE '%' || $3 || '%')
       OR EXISTS (SELECT 1 FROM dogs d WHERE d.client_id = c.id AND d.name ILIKE '%' || $2 || '%'))
     ORDER BY c.name LIMIT 200`,
    [account.id, q, q.replace(/\D/g, "")],
  );
  return (
    <>
      <h1>Clients</h1>
      <form className="row" style={{ marginBottom: 12 }}>
        <input name="q" defaultValue={q} placeholder="Search by name, dog, or phone" style={{ flex: 1 }} />
        <button className="secondary">Search</button>
      </form>
      <div className="card">
        {rows.length === 0 ? (
          q ? (
            <Empty title={`No clients match “${q}”.`} />
          ) : (
            <Empty title="No clients yet.">
              <p>Everyone who books, online or added by you, shows up here with their dogs and history.</p>
            </Empty>
          )
        ) : (
          <ul className="list">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/app/clients/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="spread">
                    <strong>{c.name}</strong>
                    <span className="muted small">{formatPhone(c.phone_e164)}</span>
                  </div>
                  <div className="muted small">
                    {c.dogs ?? "No dogs"} · {c.visits} visit{c.visits === "1" ? "" : "s"}
                    {c.next && " · upcoming booking"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
