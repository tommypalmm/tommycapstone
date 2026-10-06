"use client";

import { useActionState } from "react";
import { submitBooking } from "./actions";

export function BookingForm({
  hidden,
  consentText,
  submitLabel,
}: {
  hidden: Record<string, string>;
  consentText: string;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(submitBooking, {});
  return (
    <form action={action} className="card">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {state.error && (
        <div className="msg error" role="alert">
          {state.error}
        </div>
      )}
      <label htmlFor="name">Your name</label>
      <input id="name" name="name" required autoComplete="name" />
      <label htmlFor="phone">Mobile number</label>
      <input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="(315) 555-0100" />
      <label htmlFor="email">Email (optional)</label>
      <input id="email" name="email" type="email" autoComplete="email" />
      <div className="grid2">
        <div>
          <label htmlFor="dog_name">Dog&apos;s name</label>
          <input id="dog_name" name="dog_name" required />
        </div>
        <div>
          <label htmlFor="dog_breed">Breed (optional)</label>
          <input id="dog_breed" name="dog_breed" />
        </div>
      </div>
      <label htmlFor="dog_size">Size (optional)</label>
      <select id="dog_size" name="dog_size" defaultValue="">
        <option value="">Choose…</option>
        <option>Small</option>
        <option>Medium</option>
        <option>Large</option>
        <option>Extra large</option>
      </select>
      <label className="check" style={{ marginTop: 16 }}>
        <input type="checkbox" name="consent" />
        <span className="small">{consentText}</span>
      </label>
      <div className="hint">Optional. Without it, you won&apos;t get a text confirmation or reminder.</div>
      <button className="block" disabled={pending}>
        {pending ? "Booking…" : submitLabel}
      </button>
    </form>
  );
}
