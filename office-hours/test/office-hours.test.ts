import { describe, it, expect } from "vitest";
import { renderReminderList } from "../src/office-hours.js";
import type { Reminder } from "../src/reminders.js";

const now = new Date("2026-06-05T12:00:00Z");
const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function reminder(title: string, offsetMs: number): Reminder {
  return {
    jitKey: `jit-${title}`,
    title,
    repo: "natb1/office-hours-nate",
    issueNumber: 1,
    dueAt: new Date(now.getTime() + offsetMs),
  };
}

describe("renderReminderList", () => {
  it("renders an empty ul#reminder-list and the empty-state placeholder for no reminders", () => {
    const el = renderReminderList([], now);

    const list = el.querySelector("#reminder-list");
    expect(list).not.toBeNull();
    expect(list?.tagName).toBe("UL");
    expect(list?.querySelectorAll("li").length).toBe(0);

    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe("No reminders.");
  });

  it("renders one li.reminder per reminder, due-ascending, with title and due labels", () => {
    // Unsorted input: future-later, overdue-most, due-soon, overdue-less.
    const reminders = [
      reminder("future-2d", 2 * DAY),
      reminder("overdue-4h", -4 * HOUR),
      reminder("due-30m", 30 * MINUTE),
      reminder("overdue-10m", -10 * MINUTE),
    ];

    const el = renderReminderList(reminders, now);
    const items = Array.from(el.querySelectorAll("li.reminder"));
    expect(items.length).toBe(4);

    // Most-overdue first, then soonest-due.
    const expectedOrder = ["overdue-4h", "overdue-10m", "due-30m", "future-2d"];
    const actualOrder = items.map(
      (li) => li.querySelector(".reminder-title")?.textContent ?? "",
    );
    expect(actualOrder).toEqual(expectedOrder);

    for (const li of items) {
      const title = li.querySelector(".reminder-title");
      expect(title).not.toBeNull();
      expect(title?.textContent).not.toBe("");

      const due = li.querySelector(".reminder-due");
      expect(due).not.toBeNull();
      expect(due?.textContent).not.toBe("");
    }

    // No empty-state when the list is non-empty.
    expect(el.querySelector(".empty")).toBeNull();
  });

  it("marks an overdue reminder's due label with the overdue class and a future one without", () => {
    const reminders = [reminder("overdue-4h", -4 * HOUR), reminder("future-2d", 2 * DAY)];
    const el = renderReminderList(reminders, now);
    const items = Array.from(el.querySelectorAll("li.reminder"));

    const overdueLi = items[0]; // sorted: overdue first
    const futureLi = items[1];

    expect(overdueLi.querySelector(".reminder-title")?.textContent).toBe("overdue-4h");
    expect(overdueLi.querySelector(".reminder-due")?.classList.contains("overdue")).toBe(true);

    expect(futureLi.querySelector(".reminder-title")?.textContent).toBe("future-2d");
    expect(futureLi.querySelector(".reminder-due")?.classList.contains("overdue")).toBe(false);
  });
});
