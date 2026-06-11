import { describe, it, expect } from "vitest";
import { renderApp } from "../src/app-view.js";
import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";

const now = new Date("2026-06-11T12:00:00Z");

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root (mirrors history-band.test.ts).
function withThemeFg<T>(fn: () => T): T {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
  try {
    return fn();
  } finally {
    document.documentElement.style.removeProperty("--fg");
  }
}

const baseSample: UsageSample = {
  sampledAt: new Date("2026-06-07T10:00:00Z"),
  fiveHourUsedPct: 42.5,
  weeklyUsedPct: 18.3,
  fiveHourResetsAt: new Date("2026-06-07T15:00:00Z"),
  weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
  activeWorkers: 3,
  targetWorkers: 4,
  groupId: "group-abc",
};

const makeSample = (o: Partial<UsageSample> = {}): UsageSample => ({ ...baseSample, ...o });

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function makeReminder(title: string, offsetMs: number): Reminder {
  return {
    jitKey: `jit-${title}`,
    title,
    repo: "natb1/office-hours-test",
    issueNumber: 1,
    dueAt: new Date(now.getTime() + offsetMs),
  };
}

describe("renderApp — demo tier", () => {
  it("renders a .demo-banner with the correct text", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    const banner = container.querySelector(".demo-banner");
    expect(banner).not.toBeNull();
    expect(banner!.textContent).toBe("Demo data — sign in to see your queue.");
  });

  it("renders the capacity heading", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    const heading = container.querySelector(".capacity-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("CAPACITY");
  });

  it("renders chart layouts from the demo samples", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    // getDemoSamples() returns non-empty data so both chart layouts render
    const layouts = container.querySelectorAll(".chart-layout");
    expect(layouts.length).toBeGreaterThan(0);
  });

  it("does not render an .error element", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    expect(container.querySelector(".error")).toBeNull();
  });
});

describe("renderApp — owner tier with data", () => {
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];

  it("does not render a .demo-banner", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "owner", samples, reminders }, now));

    expect(container.querySelector(".demo-banner")).toBeNull();
  });

  it("renders a reminder list item for each reminder", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "owner", samples, reminders }, now));

    const items = container.querySelectorAll("li.reminder");
    expect(items.length).toBe(2);
  });

  it("does not render an .error element", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "owner", samples, reminders }, now));

    expect(container.querySelector(".error")).toBeNull();
  });
});

describe("renderApp — owner tier empty", () => {
  it("does not render a .demo-banner", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [] }, now),
    );

    expect(container.querySelector(".demo-banner")).toBeNull();
  });

  it('renders the reminder-list empty state "No reminders."', () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [] }, now),
    );

    const list = container.querySelector("#reminder-list");
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll("li").length).toBe(0);

    // The empty placeholder lives alongside the list in the same section
    const empties = Array.from(container.querySelectorAll(".empty"));
    const reminderEmpty = empties.find((el) => el.textContent === "No reminders.");
    expect(reminderEmpty).not.toBeUndefined();
  });

  it('renders the capacity empty state "No capacity data."', () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [] }, now),
    );

    const empties = Array.from(container.querySelectorAll(".empty"));
    const capacityEmpty = empties.find((el) => el.textContent === "No capacity data.");
    expect(capacityEmpty).not.toBeUndefined();
  });

  it("does not render an .error element", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [] }, now),
    );

    expect(container.querySelector(".error")).toBeNull();
  });
});

describe("renderApp — error tier", () => {
  it("renders a .error with the correct text", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);

    const error = container.querySelector(".error");
    expect(error).not.toBeNull();
    expect(error!.textContent).toBe("Couldn't load your queue. Please try again.");
  });

  it("does not render a .demo-banner", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);

    expect(container.querySelector(".demo-banner")).toBeNull();
  });

  it("does not render the capacity heading", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);

    expect(container.querySelector(".capacity-heading")).toBeNull();
  });
});

describe("renderApp — replaceChildren between calls", () => {
  it("removes the demo banner when re-rendered as error", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    // Demo banner is present after first render
    expect(container.querySelector(".demo-banner")).not.toBeNull();

    // Second render: error tier
    renderApp(container, { tier: "error" }, now);

    // Demo banner must be gone
    expect(container.querySelector(".demo-banner")).toBeNull();
    // Error element must be present
    expect(container.querySelector(".error")).not.toBeNull();
  });
});
