// Config-driven plan → feature gating (Decision #2). Tier contents are
// provisional (backlog B1); change them here, no schema migration needed.

export type Feature = "booking" | "reminders" | "reviews" | "rebooking" | "session_notes" | "multi_staff";

export const PLANS: Record<string, { label: string; priceMonthly: number; features: Feature[]; maxStaff: number }> = {
  starter: { label: "Starter", priceMonthly: 29, features: ["booking", "reminders", "reviews"], maxStaff: 1 },
  pro: {
    label: "Pro",
    priceMonthly: 49,
    features: ["booking", "reminders", "reviews", "rebooking", "session_notes", "multi_staff"],
    maxStaff: 4,
  },
  team: {
    label: "Team",
    priceMonthly: 99,
    features: ["booking", "reminders", "reviews", "rebooking", "session_notes", "multi_staff"],
    maxStaff: 15,
  },
};

export function hasFeature(plan: string, feature: Feature): boolean {
  return (PLANS[plan] ?? PLANS.starter).features.includes(feature);
}

export function maxStaff(plan: string): number {
  return (PLANS[plan] ?? PLANS.starter).maxStaff;
}
