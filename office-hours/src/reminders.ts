import { logError } from "@commons-systems/errorutil/log";

export interface Reminder {
  jitKey: string;
  title: string;
  repo: string;
  issueNumber: number;
  dueAt: Date;
}

/**
 * Maps a raw reminder document map to a Reminder, or null when a required field
 * is missing/mistyped. A Firestore Timestamp `dueAt` is revived via its
 * `.toDate()` method (a plain `Date` fails that test, so ISO-string wire values
 * must be revived into a `{ toDate }` shim before reaching here — see
 * snapshot-wire.ts). A missing `jitKey` falls back to the document id.
 *
 * Extracted here (from the vite-virtual-import-bound `data.ts`) so the single
 * reminder parser is shared by every consumer: the reader dashboard, the
 * snapshot decoder, and the firebase-admin producer's parity/deserialize paths,
 * none of which can load `data.ts`.
 */
export function toReminder(id: string, data: Record<string, unknown>): Reminder | null {
  const title = typeof data.title === "string" ? data.title : null;
  const repo = typeof data.repo === "string" ? data.repo : null;
  const issueNumber = typeof data.issueNumber === "number" ? data.issueNumber : null;
  const dueAtRaw = data.dueAt;
  const dueAt =
    dueAtRaw && typeof (dueAtRaw as { toDate?: unknown }).toDate === "function"
      ? (dueAtRaw as { toDate: () => Date }).toDate()
      : null;
  if (title === null || repo === null || issueNumber === null || dueAt === null) {
    logError(new Error("office-hours item missing required fields"), {
      operation: "reminder-validation",
      itemId: id,
    });
    return null;
  }
  let jitKey: string;
  if (typeof data.jitKey === "string") {
    jitKey = data.jitKey;
  } else {
    logError(new Error("office-hours item missing jitKey; falling back to document id"), {
      operation: "reminder-validation",
      itemId: id,
    });
    jitKey = id;
  }
  return { jitKey, title, repo, issueNumber, dueAt };
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * Returns a new array sorted by due time ascending — most-overdue first, then
 * soonest-due. Does not mutate the input.
 */
export function sortByDueAscending(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

export function humanize(absMs: number): string {
  if (absMs < HOUR) return `${Math.round(absMs / MINUTE)}m`;
  if (absMs < DAY) return `${Math.round(absMs / HOUR)}h`;
  return `${Math.round(absMs / DAY)}d`;
}

/**
 * Human-readable time-to-due relative to `now`: "due in 3h" / "due in 2d" when
 * the due time is in the future, "overdue 4h" when it has passed.
 */
export function formatDueLabel(dueAt: Date, now: Date): string {
  const delta = dueAt.getTime() - now.getTime();
  if (delta < 0) return `overdue ${humanize(-delta)}`;
  return `due in ${humanize(delta)}`;
}

/**
 * Content signature for the reminders panel's now-derived output.
 *
 * The sort order depends only on `dueAt` (fixed per array), so it is covered by
 * the caller's `reminders`-reference dep; this key captures the now-derived
 * per-row output — the due label, whose `overdue …`/`due in …` prefix already
 * discriminates the overdue boundary — in sorted order. A
 * memo keyed on this signature reuses its element (and skips the re-render)
 * across a tick that changes none of those rows. Empty array → "".
 *
 * Covers: per-row due label (in sorted order) — must mirror RemindersPanel's
 * now-derived output. When adding a new now-derived field to RemindersPanel,
 * add it here too or the memo will miss its changes.
 */
export function remindersPanelKey(reminders: Reminder[], now: Date): string {
  return sortByDueAscending(reminders)
    .map((r) => formatDueLabel(r.dueAt, now))
    .join("~");
}
