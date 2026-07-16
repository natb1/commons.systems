import type { IntentionNode } from "./schema.js";

// --- Types -------------------------------------------------------------------

/** One author-logged participation event on `attributes.participation_log`. */
export interface ParticipationEntry {
  date: string;
  venue: string;
  activity: string;
  challenge: string | null;
}

// --- Helpers -------------------------------------------------------------------

function isPlainObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

/**
 * Validate one raw log entry, returning the parsed `ParticipationEntry` or a
 * defect message describing why it's malformed. Defensive parsing at the
 * boundary — `attributes` shape is data (author-maintained YAML), not a code
 * contract, so a malformed entry is described and skipped rather than thrown.
 */
function parseEntry(raw: unknown, index: number): ParticipationEntry | string {
  if (!isPlainObjectLike(raw)) {
    return `entry ${index}: expected an object, got ${typeof raw}`;
  }
  if (!isNonEmptyString(raw.date) || !DATE_RE.test(raw.date)) {
    return `entry ${index}: expected a YYYY-MM-DD date string for "date", got ${JSON.stringify(raw.date)}`;
  }
  if (!isNonEmptyString(raw.venue)) {
    return `entry ${index}: expected a non-empty string for "venue", got ${JSON.stringify(raw.venue)}`;
  }
  if (!isNonEmptyString(raw.activity)) {
    return `entry ${index}: expected a non-empty string for "activity", got ${JSON.stringify(raw.activity)}`;
  }
  const challenge = raw.challenge;
  if (challenge != null && typeof challenge !== "string") {
    return `entry ${index}: expected a string or null for "challenge", got ${typeof challenge}`;
  }

  return {
    date: raw.date,
    venue: raw.venue,
    activity: raw.activity,
    challenge: challenge ?? null,
  };
}

/**
 * Parse `node.attributes.participation_log` — the author-maintained record of
 * participation events (strategy clarification on
 * strategy-join-existing-practice: "a list of {date, venue, activity,
 * challenge} entries the author appends after each participation event").
 *
 * Defensive at the boundary: absent/empty is an honest zero (`{entries: [],
 * malformed: []}`), not an error. A non-array attribute, or any entry missing
 * or mistyping a required field, is described in `malformed` by index and
 * defect while parsing continues over the rest. Returned entries are sorted
 * by `date` ascending.
 */
export function parseParticipationLog(node: IntentionNode): {
  entries: ParticipationEntry[];
  malformed: string[];
} {
  const raw = node.attributes.participation_log;
  if (raw == null) {
    return { entries: [], malformed: [] };
  }
  if (!Array.isArray(raw)) {
    return {
      entries: [],
      malformed: [`attributes.participation_log: expected an array, got ${typeof raw}`],
    };
  }

  const entries: ParticipationEntry[] = [];
  const malformed: string[] = [];
  raw.forEach((item, index) => {
    const parsed = parseEntry(item, index);
    if (typeof parsed === "string") {
      malformed.push(parsed);
    } else {
      entries.push(parsed);
    }
  });

  entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return { entries, malformed };
}

// --- Summary -------------------------------------------------------------------

/** Evidence assembly over a parsed log — counts only, never a pass/fail verdict. */
export interface ParticipationSummary {
  count: number;
  firstDate: string | null;
  lastDate: string | null;
  distinctVenues: number;
  last30Days: number;
  last90Days: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days between two YYYY-MM-DD dates (`to` minus `from`); each is read at UTC midnight. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/**
 * Summarize a parsed participation log as-of `today` (YYYY-MM-DD). Evidence
 * only — no scoring or thresholding of the recurrence judgment; that's an
 * owner-review call, not this function's.
 */
export function participationSummary(
  entries: ParticipationEntry[],
  today: string,
): ParticipationSummary {
  if (entries.length === 0) {
    return {
      count: 0,
      firstDate: null,
      lastDate: null,
      distinctVenues: 0,
      last30Days: 0,
      last90Days: 0,
    };
  }

  // entries is expected sorted ascending by parseParticipationLog, but derive
  // first/last defensively rather than assume caller-supplied order.
  let firstDate = entries[0].date;
  let lastDate = entries[0].date;
  const venues = new Set<string>();
  let last30Days = 0;
  let last90Days = 0;

  for (const entry of entries) {
    if (entry.date < firstDate) firstDate = entry.date;
    if (entry.date > lastDate) lastDate = entry.date;
    venues.add(entry.venue);

    const age = daysBetween(entry.date, today); // >= 0 means entry.date <= today
    if (age >= 0 && age <= 30) last30Days++;
    if (age >= 0 && age <= 90) last90Days++;
  }

  return {
    count: entries.length,
    firstDate,
    lastDate,
    distinctVenues: venues.size,
    last30Days,
    last90Days,
  };
}

// --- Challenge routing state -----------------------------------------------------

export interface ChallengeState {
  logged: ParticipationEntry[];
  externalReading: string | null;
  externalGap: string | null;
}

/**
 * Assemble the challenge-routing evidence: which logged entries carry a
 * challenge, alongside `strategy-external-calibration`'s current
 * reading/gap (verbatim, no boolean routed/unrouted heuristic — that
 * judgment is the owner's at review).
 */
export function challengeState(
  entries: ParticipationEntry[],
  externalCalibration: IntentionNode,
): ChallengeState {
  return {
    logged: entries.filter((entry) => entry.challenge !== null),
    externalReading: externalCalibration.reading,
    externalGap: externalCalibration.gap,
  };
}
