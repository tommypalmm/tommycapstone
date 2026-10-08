// Runs the job queue in-process every 30s so reminders go out within a minute
// of schedule. Starts on its own only with the local embedded database; on a
// long-running server set JOB_TICKER=on. On serverless hosts, leave it off and
// call /api/cron/tick every minute instead.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.JOB_TICKER === "off") return;
  if (process.env.JOB_TICKER !== "on" && process.env.DATABASE_URL) return;
  const g = globalThis as unknown as { __petproTicker?: NodeJS.Timeout };
  if (g.__petproTicker) return;
  const { runDueJobs } = await import("./lib/jobs");
  const tick = () => runDueJobs().catch((e) => console.error("[jobs] tick failed:", e));
  g.__petproTicker = setInterval(tick, 30_000);
  setTimeout(tick, 2_000);
}
