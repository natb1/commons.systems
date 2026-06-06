import { describe, it, expect } from "vitest";
import { sortByDueAscending, formatDueLabel } from "../src/reminders.js";

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe("sortByDueAscending", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  const makeReminder = (jitKey: string, offsetMs: number) => ({
    jitKey,
    title: `Reminder ${jitKey}`,
    repo: "natb1/office-hours-nate",
    issueNumber: 1,
    dueAt: new Date(now.getTime() + offsetMs),
  });

  it("sorts reminders by due time ascending — most-overdue first, then soonest-due", () => {
    const reminders = [
      makeReminder("future-2d", 2 * DAY),
      makeReminder("overdue-1h", -1 * HOUR),
      makeReminder("future-3h", 3 * HOUR),
      makeReminder("overdue-4h", -4 * HOUR),
      makeReminder("future-7d", 7 * DAY),
    ];

    const sorted = sortByDueAscending(reminders);

    expect(sorted.map((r) => r.jitKey)).toEqual([
      "overdue-4h",
      "overdue-1h",
      "future-3h",
      "future-2d",
      "future-7d",
    ]);
  });

  it("does not mutate the input array", () => {
    const reminders = [
      makeReminder("b", 1 * HOUR),
      makeReminder("a", -1 * HOUR),
      makeReminder("c", 2 * DAY),
    ];
    const originalOrder = reminders.map((r) => r.jitKey);

    const sorted = sortByDueAscending(reminders);

    // Original array order is unchanged
    expect(reminders.map((r) => r.jitKey)).toEqual(originalOrder);
    // Returned array is a different reference
    expect(sorted).not.toBe(reminders);
  });
});

describe("formatDueLabel", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it('returns "overdue 4h" when 4 hours overdue', () => {
    const dueAt = new Date(now.getTime() - 4 * HOUR);
    expect(formatDueLabel(dueAt, now)).toBe("overdue 4h");
  });

  it('returns "overdue 1h" when 1 hour overdue', () => {
    const dueAt = new Date(now.getTime() - 1 * HOUR);
    expect(formatDueLabel(dueAt, now)).toBe("overdue 1h");
  });

  it('returns "overdue 30m" when 30 minutes overdue', () => {
    const dueAt = new Date(now.getTime() - 30 * MINUTE);
    expect(formatDueLabel(dueAt, now)).toBe("overdue 30m");
  });

  it('returns "due in 3h" when due in 3 hours', () => {
    const dueAt = new Date(now.getTime() + 3 * HOUR);
    expect(formatDueLabel(dueAt, now)).toBe("due in 3h");
  });

  it('returns "due in 2d" when due in 2 days', () => {
    const dueAt = new Date(now.getTime() + 2 * DAY);
    expect(formatDueLabel(dueAt, now)).toBe("due in 2d");
  });

  it('returns "due in 7d" when due in 7 days', () => {
    const dueAt = new Date(now.getTime() + 7 * DAY);
    expect(formatDueLabel(dueAt, now)).toBe("due in 7d");
  });

  it('returns "due in 45m" when due in 45 minutes', () => {
    const dueAt = new Date(now.getTime() + 45 * MINUTE);
    expect(formatDueLabel(dueAt, now)).toBe("due in 45m");
  });

  it('returns "due in 0m" when due exactly now', () => {
    const dueAt = new Date(now.getTime());
    expect(formatDueLabel(dueAt, now)).toBe("due in 0m");
  });
});
