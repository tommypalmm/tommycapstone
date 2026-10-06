import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Flash, type SearchParams } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return (
    <main className="wrap narrow">
      <h1 style={{ marginTop: 24 }}>Log in</h1>
      <Flash sp={sp} />
      <form action={login} className="card">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
        <button className="block" type="submit">
          Log in
        </button>
      </form>
      <p className="muted">
        New here? <Link href="/signup">Create an account</Link>
      </p>
      <p className="muted small">Staff: use the email and password your business owner set up for you.</p>
    </main>
  );
}
