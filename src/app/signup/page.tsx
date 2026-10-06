import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { Flash, type SearchParams } from "@/components/ui";
import { TimeZoneSelect } from "@/components/TimeZoneSelect";

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return (
    <main className="wrap narrow">
      <h1 style={{ marginTop: 24 }}>Create your account</h1>
      <p className="muted">Takes about a minute. You&apos;ll set your hours and services next.</p>
      <Flash sp={sp} />
      <form action={signup} className="card">
        <label htmlFor="business_name">Business name</label>
        <input id="business_name" name="business_name" required placeholder="Sandy's Grooming" />
        <label htmlFor="owner_name">Your name</label>
        <input id="owner_name" name="owner_name" required autoComplete="name" />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="phone">Your mobile number</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(315) 555-0100" />
        <div className="hint">We text you here when a client cancels.</div>
        <label htmlFor="timezone">Time zone</label>
        <TimeZoneSelect name="timezone" value="America/New_York" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <button className="block" type="submit">
          Create account
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
