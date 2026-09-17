const WORKOUTX_API = "https://api.workoutxapp.com/v1";

/**
 * WorkoutX's gifUrl points at an endpoint that itself requires the
 * X-WorkoutX-Key header (confirmed by hand — a bare fetch 401s), so it can
 * never be used directly as an <img src> in the browser. This extracts the
 * gif filename so the UI can route through our own proxy
 * (/api/exercise-gif/[filename]) instead, which holds the real key
 * server-side. Returns null for anything that doesn't look like a WorkoutX
 * gif URL, which the UI treats the same as "no gif" rather than guessing.
 */
export function exerciseGifProxyPath(gifUrl: string | null): string | null {
  if (!gifUrl) return null;
  const match = /\/gifs\/([a-zA-Z0-9_-]+\.gif)$/.exec(gifUrl);
  return match ? `/api/exercise-gif/${match[1]}` : null;
}

export type WorkoutXExercise = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  secondaryMuscles: string[];
  gifUrl: string | null;
};

// WorkoutX's free tier caps at 500 requests/month and 30/min. This is a
// best-effort, in-memory counter (resets on cold start, not shared across
// instances) — not a hard limiter, just a log-based early warning, same
// pattern as the Unsplash rate-limit warning (lib/images/unsplash.ts).
const RATE_LIMIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WARN_THRESHOLD = 400;
let requestCount = 0;
let windowStartedAt = Date.now();

function recordWorkoutXRequest() {
  const now = Date.now();
  if (now - windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    requestCount = 0;
    windowStartedAt = now;
  }
  requestCount += 1;
  if (requestCount >= RATE_LIMIT_WARN_THRESHOLD) {
    console.warn(
      `[workoutx] ${requestCount} requests in the current ~monthly window (free tier limit is 500/month)`
    );
  }
}

// Crude singular/plural stemming (strip a trailing "s" on longer words) so
// "tricep" and "triceps", "bicep" and "biceps" compare as the same word —
// without it, "Cable Tricep Pushdown" scored a tie between the genuine
// "Cable Triceps Pushdown" and the wrong "Cable Incline Pushdown", and the
// wrong one won the tie.
function stem(word: string): string {
  return word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word;
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(stem)
    .sort()
    .join(" ");
}

/** Word-overlap similarity (0-1) between two exercise names — good enough
 * for "Dumbbell Bicep Curl" vs. "Biceps Curl (Dumbbell)" style naming
 * differences without needing a real fuzzy-match library. */
function nameSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(" "));
  const wordsB = new Set(normalize(b).split(" "));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared++;
  return shared / Math.max(wordsA.size, wordsB.size);
}

const MATCH_THRESHOLD = 0.4;

// WorkoutX's `name` filter matches only when the query is (close to) a
// literal substring of its catalog's name field — querying with our own
// full name ("Barbell Back Squat") often returns zero results even when a
// good match exists, because the two catalogs don't phrase things the same
// way (confirmed by hand: querying "Barbell Back Squat" returns 0 results,
// while "squat" alone returns 81). So we search progressively broader
// keywords extracted from our name — the last word, then the last two —
// and fuzzy-score whatever candidates come back against our *full* name to
// pick the real best match, rather than trusting WorkoutX's own filter to
// narrow it down.
const EQUIPMENT_STOPWORDS = new Set([
  "barbell", "dumbbell", "cable", "machine", "bodyweight", "resistance",
  "band", "kettlebell", "chair", "bench", "or", "interval",
]);

function searchKeywords(exerciseName: string): string[] {
  const stripped = exerciseName.replace(/\(.*?\)/g, " ");
  const words = stripped
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => !EQUIPMENT_STOPWORDS.has(w));
  if (meaningful.length === 0) return [stripped.trim()];

  const keywords = [meaningful[meaningful.length - 1]];
  if (meaningful.length > 1) keywords.push(meaningful.slice(-2).join(" "));
  keywords.push(stripped.trim());
  return [...new Set(keywords.filter(Boolean))];
}

type WorkoutXApiExercise = {
  id?: string;
  name?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  secondaryMuscles?: string[];
  gifUrl?: string;
};

async function searchByName(
  query: string,
  apiKey: string
): Promise<{ status: "ok"; candidates: WorkoutXApiExercise[] } | { status: "retryable" } | { status: "error" }> {
  try {
    recordWorkoutXRequest();
    const res = await fetch(
      `${WORKOUTX_API}/exercises?name=${encodeURIComponent(query)}&limit=30`,
      { headers: { "X-WorkoutX-Key": apiKey } }
    );
    if (res.status === 429 || res.status >= 500) return { status: "retryable" };
    if (!res.ok) return { status: "error" };

    const data = (await res.json()) as
      | { data?: WorkoutXApiExercise[]; results?: WorkoutXApiExercise[] }
      | WorkoutXApiExercise[];
    const candidates = Array.isArray(data) ? data : data.data ?? data.results ?? [];
    return { status: "ok", candidates };
  } catch {
    return { status: "retryable" };
  }
}

/**
 * "matched"/"no_match" are terminal outcomes worth caching permanently
 * (ensureExerciseGifs writes exercise_gif_fetched_at for these). "retryable"
 * covers rate limiting (429) and transient failures (5xx, network errors) —
 * caching those as a permanent miss would silently and incorrectly write off
 * an exercise that never actually got a fair lookup, which is exactly what
 * happened running the initial 31-exercise backfill concurrently and
 * blowing through the 30/min cap. Callers must NOT cache on "retryable".
 */
export type WorkoutXLookupResult =
  | { status: "matched"; exercise: WorkoutXExercise }
  | { status: "no_match" }
  | { status: "retryable" };

/** Searches WorkoutX for the best name match for a given exercise. */
export async function findWorkoutXExercise(exerciseName: string): Promise<WorkoutXLookupResult> {
  const apiKey = process.env.WORKOUT_VIDEO_API_KEY;
  if (!apiKey) return { status: "retryable" };

  const ourWordCount = normalize(exerciseName).split(" ").filter(Boolean).length;
  let best: WorkoutXApiExercise | null = null;
  let bestScore = 0;
  let bestWordCountDiff = Infinity;
  let first = true;

  for (const keyword of searchKeywords(exerciseName)) {
    if (!first) await new Promise((r) => setTimeout(r, 500));
    first = false;
    const result = await searchByName(keyword, apiKey);
    if (result.status === "retryable") return { status: "retryable" };
    if (result.status === "error") continue;

    for (const candidate of result.candidates) {
      if (!candidate.name || !candidate.id) continue;
      const score = nameSimilarity(exerciseName, candidate.name);
      // Tie-break toward the candidate closest in length to our own name —
      // among equally-scoring candidates, fewer unrelated extra qualifier
      // words (or missing ones) means a tighter, more likely-correct match.
      const wordCountDiff = Math.abs(
        normalize(candidate.name).split(" ").filter(Boolean).length - ourWordCount
      );
      if (score > bestScore || (score === bestScore && wordCountDiff < bestWordCountDiff)) {
        bestScore = score;
        bestWordCountDiff = wordCountDiff;
        best = candidate;
      }
    }
    // Only stop early on a near-exact match — a broad keyword's first hit
    // clearing the bare MATCH_THRESHOLD is exactly what caused "Overhead
    // Barbell Press" to wrongly match "Barbell Bench Press" (both contain
    // "barbell" and "press"): stopping there never gave the more specific
    // "overhead press" keyword a chance to surface the real match. Trying
    // every keyword and keeping the global best is cheap (well within the
    // 500/month budget for a 31-exercise catalog cached forever after).
    if (bestScore >= 0.95) break;
  }

  if (!best || bestScore < MATCH_THRESHOLD || !best.id) return { status: "no_match" };

  return {
    status: "matched",
    exercise: {
      id: best.id,
      name: best.name ?? exerciseName,
      bodyPart: best.bodyPart ?? "",
      target: best.target ?? "",
      equipment: best.equipment ?? "",
      secondaryMuscles: best.secondaryMuscles ?? [],
      gifUrl: best.gifUrl ?? null,
    },
  };
}
