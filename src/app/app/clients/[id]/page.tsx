import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Empty, Flash, StatusTag, type SearchParams } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { money, str, withMsg } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";

async function saveDog(form: FormData) {
  "use server";
  const { account } = await requireMember();
  const clientId = str(form.get("client_id"));
  const path = `/app/clients/${clientId}`;
  const owns = await one("SELECT 1 FROM clients WHERE id = $1 AND account_id = $2", [clientId, account.id]);
  if (!owns) notFound();
  const name = str(form.get("name"));
  if (!name) redirect(withMsg(path, "error", "Dog's name is required."));
  const dogId = str(form.get("dog_id"));
  const vals = [name, str(form.get("breed")) || null, str(form.get("size")) || null, str(form.get("notes")) || null];
  if (dogId) {
    await query("UPDATE dogs SET name=$1, breed=$2, size=$3, notes=$4 WHERE id=$5 AND client_id=$6", [...vals, dogId, clientId]);
  } else {
    await query("INSERT INTO dogs (client_id, name, breed, size, notes) VALUES ($1,$2,$3,$4,$5)", [clientId, ...vals]);
  }
  revalidatePath(path);
  redirect(withMsg(path, "ok", "Dog saved."));
}

export default async function ClientDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const { account } = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await one<{
    id: string;
    name: string;
    phone_e164: string;
    email: string | null;
    sms_consent: boolean;
    sms_consent_at: Date | null;
    sms_opted_out_at: Date | null;
  }>("SELECT * FROM clients WHERE id = $1 AND account_id = $2", [id, account.id]);
  if (!c) notFound();
  const [dogs, bookings] = await Promise.all([
    query<{ id: string; name: string; breed: string | null; size: string | null; notes: string | null }>(
      "SELECT * FROM dogs WHERE client_id = $1 ORDER BY created_at",
      [id],
    ),
    query<{ id: string; start_time: Date; status: string; service: string; dog: string | null; price_cents: number }>(
      `SELECT b.id, b.start_time, b.status, s.name AS service, d.name AS dog, b.price_cents FROM bookings b
       JOIN services s ON s.id = b.service_id LEFT JOIN dogs d ON d.id = b.dog_id
       WHERE b.client_id = $1 ORDER BY b.start_time DESC`,
      [id],
    ),
  ]);
  const tz = account.timezone;

  return (
    <>
      <p>
        <Link href="/app/clients">← Clients</Link>
      </p>
      <Flash sp={sp} />
      <div className="card">
        <h1 style={{ marginBottom: 4 }}>{c.name}</h1>
        <p>
          <a href={`tel:${c.phone_e164}`}>{formatPhone(c.phone_e164)}</a>
          {c.email && <> · {c.email}</>}
        </p>
        <p className="muted small">
          Texts:{" "}
          {c.sms_opted_out_at
            ? `opted out ${formatDateTime(new Date(c.sms_opted_out_at), tz)}`
            : c.sms_consent && c.sms_consent_at
              ? `opted in ${formatDateTime(new Date(c.sms_consent_at), tz)}`
              : "no consent"}
        </p>
        <Link className="btn" href={`/app/bookings/new?client=${c.id}`}>
          Book again
        </Link>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Dogs</h2>
        {dogs.length === 0 && <Empty title="No dogs on file." />}
        {dogs.map((d) => (
          <details key={d.id} style={{ marginBottom: 8 }}>
            <summary style={{ cursor: "pointer" }}>
              <strong>{d.name}</strong> <span className="muted">{[d.breed, d.size].filter(Boolean).join(" · ")}</span>
            </summary>
            <form action={saveDog}>
              <input type="hidden" name="client_id" value={c.id} />
              <input type="hidden" name="dog_id" value={d.id} />
              <DogFields d={d} />
              <button className="block secondary">Save {d.name}</button>
            </form>
          </details>
        ))}
        <details>
          <summary style={{ cursor: "pointer" }}>+ Add a dog</summary>
          <form action={saveDog}>
            <input type="hidden" name="client_id" value={c.id} />
            <DogFields />
            <button className="block secondary">Add dog</button>
          </form>
        </details>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>History</h2>
        {bookings.length === 0 ? (
          <Empty title="No bookings yet." />
        ) : (
          <ul className="list">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link href={`/app/bookings/${b.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="spread">
                    <span>{formatDateTime(new Date(b.start_time), tz)}</span>
                    <StatusTag status={b.status} />
                  </div>
                  <div className="muted small">
                    {b.service}
                    {b.dog && ` · ${b.dog}`} · {money(b.price_cents)}
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

function DogFields({ d }: { d?: { name: string; breed: string | null; size: string | null; notes: string | null } }) {
  return (
    <>
      <label>Name</label>
      <input name="name" defaultValue={d?.name} required />
      <div className="grid2">
        <div>
          <label>Breed</label>
          <input name="breed" defaultValue={d?.breed ?? ""} />
        </div>
        <div>
          <label>Size</label>
          <input name="size" defaultValue={d?.size ?? ""} />
        </div>
      </div>
      <label>Notes (temperament, coat, allergies…)</label>
      <textarea name="notes" defaultValue={d?.notes ?? ""} />
    </>
  );
}
