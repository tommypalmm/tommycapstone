import { NextResponse, type NextRequest } from "next/server";
import { runDueJobs } from "@/lib/jobs";

// Call every minute from an external scheduler (e.g. Vercel Cron) when JOB_TICKER=off.
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? req.nextUrl.searchParams.get("secret");
  if (!secret || given !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await runDueJobs());
}

export const GET = handle;
export const POST = handle;
