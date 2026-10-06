import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireMember } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const m = await requireMember();
  return (
    <>
      <nav className="top">
        <div className="wrap">
          <Link className="brand" href="/app">
            {m.account.business_name}
          </Link>
          <Link href="/app">Today</Link>
          <Link href="/app/bookings/new">+ Booking</Link>
          <Link href="/app/clients">Clients</Link>
          <Link href="/app/messages">Texts</Link>
          {m.isOwner && <Link href="/app/settings">Settings</Link>}
          <form action={logout} className="inline">
            <button className="secondary" style={{ minHeight: 36, padding: "4px 10px" }}>
              Log out
            </button>
          </form>
        </div>
      </nav>
      <main className="wrap">{children}</main>
    </>
  );
}
