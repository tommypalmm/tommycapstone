import type { WeeklyHours } from "./time";

export interface Account {
  id: string;
  slug: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  plan: string;
  status: "active" | "offboarded";
  timezone: string;
  booking_interval_min: number | null;
  operating_hours: WeeklyHours | null;
  buffer_minutes: number;
  cancel_cutoff_hours: number;
  deposit_policy: string | null;
  refund_policy: string | null;
  cancellation_policy: string | null;
  default_rebook_days: number | null;
  review_link: string | null;
  contact_link: string | null;
  meta_pixel_id: string | null;
  processor: string | null;
  twilio_subaccount_sid: string | null;
  twilio_from_number: string | null;
}

export interface Staff {
  id: string;
  account_id: string;
  user_id: string | null;
  name: string;
  role: "owner" | "staff";
  working_hours: WeeklyHours | null;
  buffer_minutes: number | null;
  active: boolean;
}

export interface Service {
  id: string;
  account_id: string;
  name: string;
  type: "grooming" | "training";
  size_tier: string | null;
  duration_min: number;
  price_cents: number;
  requires_deposit: boolean;
  deposit_cents: number;
  rebook_cycle_days: number | null;
  active: boolean;
}

export interface Booking {
  id: string;
  account_id: string;
  client_id: string;
  dog_id: string | null;
  service_id: string;
  staff_id: string;
  start_time: Date;
  end_time: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  source: string;
  price_cents: number;
  manage_token: string;
  external_event_id: string | null;
}
