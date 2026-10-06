import Link from "next/link";
import { APP_NAME } from "@/lib/format";

export default function Home() {
  return (
    <main className="wrap narrow">
      <h1 style={{ marginTop: 32 }}>{APP_NAME}</h1>
      <p>
        Online booking, automatic text reminders, and rebooking for independent dog trainers and groomers. One flat
        price, texts included.
      </p>
      <div className="card">
        <ul>
          <li>Clients book themselves, 24/7, from your website or Instagram link.</li>
          <li>Automatic reminders cut no-shows.</li>
          <li>Past clients get nudged to rebook on their cycle.</li>
          <li>Your rules: hours, buffers, cancellation and deposit policies.</li>
        </ul>
      </div>
      <Link className="btn block" href="/signup">
        Start free
      </Link>
      <Link className="btn secondary block" href="/login">
        Log in
      </Link>
    </main>
  );
}
