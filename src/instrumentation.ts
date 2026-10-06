// Runs the job queue in-process every 30s so reminders go out within a minute
// of schedule. In production on serverless hosts, set JOB_TICKER=off and call
// /api/cron/tick every minute instead.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.JOB_TICKER === "off") return;
  const g = globalThis as unknown as { __petproTicker?: NodeJS.Timeout };
  if (g.__petproTicker) return;
  const { runDueJobs } = await import("./lib/jobs");
  const tick = () => runDueJobs().catch((e) => console.error("[jobs] tick failed:", e));
  g.__petproTicker = setInterval(tick, 30_000);
  setTimeout(tick, 2_000);
}
