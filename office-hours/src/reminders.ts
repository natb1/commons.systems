export interface Reminder {
  jitKey: string;
  title: string;
  repo: string;
  issueNumber: number;
  dueAt: Date;
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

function humanize(absMs: number): string {
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
