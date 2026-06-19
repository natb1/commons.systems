import { describe, it, expect } from "vitest";
import { renderReminderList } from "../src/office-hours.js";
import type { Reminder, MergePrItem } from "../src/reminders.js";

const now = new Date("2026-06-05T12:00:00Z");
const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function reminder(title: string, offsetMs: number): Reminder {
  return {
    kind: "reminder",
    jitKey: `jit-${title}`,
    title,
    repo: "natb1/office-hours-nate",
    issueNumber: 1,
    dueAt: new Date(now.getTime() + offsetMs),
  };
}

function mergePr(overrides: Partial<MergePrItem> = {}): MergePrItem {
  return {
    kind: "merge-pr",
    title: "Fix flaky test",
    repo: "natb1/commons.systems",
    issueNumber: 42,
    prTitle: "fix: stop the flakiness",
    prUrl: "https://github.com/natb1/commons.systems/pull/99",
    prNumber: 99,
    prRepo: "natb1/commons.systems",
    ...overrides,
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

describe("renderReminderList merge-pr", () => {
  it("renders a single merge-pr item as li.merge-pr with a.merge-pr-link pointing to prUrl", () => {
    const item = mergePr();
    const el = renderReminderList([item], now);

    const list = el.querySelector("#reminder-list");
    expect(list).not.toBeNull();

    const liItems = list!.querySelectorAll("li.merge-pr");
    expect(liItems.length).toBe(1);

    const link = liItems[0].querySelector("a.merge-pr-link");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe(item.prUrl);
    expect(link!.textContent).toBe(item.prTitle);

    // No empty placeholder when there is a merge-pr item.
    expect(el.querySelector(".empty")).toBeNull();
  });

  it("renders merge-pr items before reminder items regardless of input order", () => {
    const r = reminder("some-reminder", DAY);
    const mp = mergePr();

    // Input order: reminder first, then merge-pr.
    const el = renderReminderList([r, mp], now);
    const allLis = Array.from(el.querySelectorAll("#reminder-list li"));

    expect(allLis.length).toBe(2);
    expect(allLis[0].classList.contains("merge-pr")).toBe(true);
    expect(allLis[1].classList.contains("reminder")).toBe(true);
  });

  it("renders only li.reminder elements (no li.merge-pr) when input contains only reminders", () => {
    const el = renderReminderList([reminder("only-reminder", HOUR)], now);
    const list = el.querySelector("#reminder-list");

    expect(list!.querySelectorAll("li.reminder").length).toBe(1);
    expect(list!.querySelectorAll("li.merge-pr").length).toBe(0);
    expect(el.querySelector(".empty")).toBeNull();
  });
});
