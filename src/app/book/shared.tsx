import { one } from "@/lib/db";
import type { Account } from "@/lib/types";

export const CARRY = ["b", "src", "utm_source", "ref", "embed"] as const;

export function bookUrl(base: Record<string, string | undefined>, extra: Record<string, string | undefined> = {}): string {
  const p = new URLSearchParams();
  for (const k of CARRY) if (base[k]) p.set(k, base[k]!);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  return `/book?${p}`;
}

export async function accountBySlug(slug: string | undefined): Promise<Account | null> {
  if (!slug) return null;
  return one<Account>("SELECT * FROM accounts WHERE slug = $1", [slug]);
}

/** Meta Pixel, on by default when the owner set a Pixel ID (Decision #12). CAPI is deferred. */
export function MetaPixel({ pixelId, event }: { pixelId: string | null; event?: "Schedule" }) {
  if (!pixelId || !/^\d+$/.test(pixelId)) return null;
  const js = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');${event ? `fbq('track','${event}');` : ""}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
