import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap narrow">
      <div className="card empty">
        <strong>We couldn&apos;t find that page.</strong>
        <p>The link may be old or mistyped.</p>
        <Link href="/">Go home</Link>
      </div>
    </main>
  );
}
