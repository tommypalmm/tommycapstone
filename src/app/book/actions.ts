"use server";

import { redirect } from "next/navigation";
import { createBooking, sourceFrom } from "@/lib/bookings";
import { one } from "@/lib/db";
import { str, withMsg } from "@/lib/format";
import type { Service } from "@/lib/types";
import { accountBySlug, bookUrl } from "./shared";

export async function submitBooking(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const carry = {
    b: str(form.get("b")),
    src: str(form.get("src")) || undefined,
    utm_source: str(form.get("utm_source")) || undefined,
    ref: str(form.get("ref")) || undefined,
    embed: str(form.get("embed")) || undefined,
  };
  const serviceId = str(form.get("service"));
  const time = str(form.get("time"));
  const date = str(form.get("date"));

  const account = await accountBySlug(carry.b);
  if (!account) redirect("/book");
  const service = await one<Service>("SELECT * FROM services WHERE id = $1 AND account_id = $2", [serviceId, account.id]);
  if (!service) redirect(withMsg(bookUrl(carry), "error", "That service isn't available anymore."));

  const result = await createBooking({
    account,
    service,
    start: new Date(time),
    selfServe: true,
    client: { name: str(form.get("name")), phone: str(form.get("phone")), email: str(form.get("email")) },
    dog: { name: str(form.get("dog_name")), breed: str(form.get("dog_breed")), size: str(form.get("dog_size")) },
    consent: form.get("consent") !== null,
    source: sourceFrom(carry),
  });

  if (!result.ok) {
    // A taken slot sends the client back to the time picker with the remaining openings.
    if (result.taken) redirect(withMsg(bookUrl(carry, { service: serviceId, date }), "error", result.error));
    return { error: result.error };
  }
  redirect(bookUrl(carry, { done: result.booking.manage_token }));
}
