import Link from "next/link";
import { saveService } from "@/app/actions/settings";
import { Empty, Flash, type SearchParams } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { query } from "@/lib/db";
import { money } from "@/lib/format";
import type { Service } from "@/lib/types";

function ServiceFields({ s }: { s?: Service }) {
  const id = s?.id ?? "new";
  return (
    <>
      {s && <input type="hidden" name="id" value={s.id} />}
      <label htmlFor={`name-${id}`}>Service name</label>
      <input id={`name-${id}`} name="name" defaultValue={s?.name} required placeholder="Full groom – large dog" />
      <div className="grid2">
        <div>
          <label htmlFor={`type-${id}`}>Type</label>
          <select id={`type-${id}`} name="type" defaultValue={s?.type ?? "grooming"}>
            <option value="grooming">Grooming</option>
            <option value="training">Training</option>
          </select>
        </div>
        <div>
          <label htmlFor={`size-${id}`}>Dog size (optional)</label>
          <input id={`size-${id}`} name="size_tier" defaultValue={s?.size_tier ?? ""} placeholder="Small / Medium / Large" />
        </div>
        <div>
          <label htmlFor={`dur-${id}`}>Duration (minutes)</label>
          <input id={`dur-${id}`} name="duration_min" type="number" min={5} defaultValue={s?.duration_min ?? 60} required />
        </div>
        <div>
          <label htmlFor={`price-${id}`}>Price ($)</label>
          <input id={`price-${id}`} name="price" inputMode="decimal" defaultValue={s ? (s.price_cents / 100).toFixed(2) : ""} />
        </div>
        <div>
          <label htmlFor={`dep-${id}`}>Deposit ($, optional)</label>
          <input id={`dep-${id}`} name="deposit" inputMode="decimal" defaultValue={s?.deposit_cents ? (s.deposit_cents / 100).toFixed(2) : ""} />
        </div>
        <div>
          <label htmlFor={`cyc-${id}`}>Rebook cycle (days, optional)</label>
          <input id={`cyc-${id}`} name="rebook_cycle_days" type="number" min={1} max={365} defaultValue={s?.rebook_cycle_days ?? ""} placeholder="e.g. 42 for 6 weeks" />
        </div>
      </div>
      {s && (
        <label className="check">
          <input type="checkbox" name="active" defaultChecked={s.active} /> Offered online
        </label>
      )}
    </>
  );
}

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { account } = await requireOwner();
  const services = await query<Service>("SELECT * FROM services WHERE account_id = $1 ORDER BY active DESC, type, name", [
    account.id,
  ]);
  return (
    <>
      <p>
        <Link href="/app/settings">← Settings</Link>
      </p>
      <h1>Services</h1>
      <Flash sp={sp} />
      {services.length === 0 ? (
        <div className="card">
          <Empty title="No services yet.">
            <p>Add what you offer, like “Full groom – small dog” or “Private lesson – 1 hr”. Clients pick from these.</p>
          </Empty>
        </div>
      ) : (
        services.map((s) => (
          <details className="card" key={s.id}>
            <summary className="spread" style={{ cursor: "pointer" }}>
              <span>
                <strong>{s.name}</strong> {!s.active && <span className="tag">hidden</span>}
              </span>
              <span className="muted">
                {s.duration_min} min · {money(s.price_cents)}
              </span>
            </summary>
            <form action={saveService}>
              <ServiceFields s={s} />
              <button className="block">Save service</button>
            </form>
          </details>
        ))
      )}
      <form action={saveService} className="card">
        <h2 style={{ marginTop: 0 }}>Add a service</h2>
        <ServiceFields />
        <button className="block">Add service</button>
      </form>
    </>
  );
}
