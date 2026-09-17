import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WORKOUTX_GIF_BASE = "https://api.workoutxapp.com/v1/gifs";
const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.gif$/;

/**
 * Proxies a WorkoutX exercise GIF. Necessary because WorkoutX's gifUrl is not
 * a public static asset — it requires the same X-WorkoutX-Key header as
 * every other endpoint (confirmed by hand: a bare fetch returns 401). A
 * browser <img> tag can't attach that header, and the key can't be shipped
 * to client-side code either way, so the browser loads this same-origin
 * route instead and the actual WorkoutX request + secret key stay server-side.
 *
 * Requires an authenticated session (not public) so this can't be used as a
 * free, keyless proxy for someone else's WorkoutX budget. `filename` is
 * validated against a strict pattern and only ever appended to WorkoutX's
 * own fixed base URL — never used to build an arbitrary proxied URL.
 */
export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { filename } = await params;
  if (!FILENAME_PATTERN.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const apiKey = process.env.WORKOUT_VIDEO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const res = await fetch(`${WORKOUTX_GIF_BASE}/${filename}`, {
    headers: { "X-WorkoutX-Key": apiKey },
  });
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "Gif not available" }, { status: 502 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/gif",
      // Exercise gifs are immutable per id — safe to cache for a long time
      // both at the browser and any CDN in front of this route.
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
}
