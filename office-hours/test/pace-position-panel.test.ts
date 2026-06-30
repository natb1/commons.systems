import { describe, it, expect } from "vitest";
import { renderPacePositionPanel } from "../src/pace-position-panel.js";
import { type UsageSample } from "../src/usage-samples.js";
import { fractionToWindowDate, formatWindowTick } from "../src/weekly-pace-curve.js";

const baseSample: UsageSample = {
  sampledAt: new Date("2026-06-09T10:00:00Z"),
  fiveHourUsedPct: 42.5,
  weeklyUsedPct: 18.3,
  fiveHourResetsAt: new Date("2026-06-09T15:00:00Z"),
  weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
  activeWorkers: 3,
  targetWorkers: 4,
  groupId: "group-abc",
};

const make = (o: Partial<UsageSample> = {}): UsageSample => ({ ...baseSample, ...o });

// Two samples within ONE week (same weeklyResetsAt), sampledAt in the 7 days before it.
function oneWeekSamples(): UsageSample[] {
  return [
    make({ sampledAt: new Date("2026-06-09T00:00:00Z"), weeklyUsedPct: 20 }),
    make({ sampledAt: new Date("2026-06-12T00:00:00Z"), weeklyUsedPct: 55 }),
  ];
}

function withFg(): HTMLElement {
  // happy-dom has no stylesheet, so missing.css's --fg is absent — set it on
  // the container so getThemeFg reads it live.
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#ddd");
  document.body.appendChild(container);
  return container;
}

describe("renderPacePositionPanel", () => {
  it("shows the empty-state message for an empty array", () => {
    const el = renderPacePositionPanel([]);
    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No usage history to chart pace position.");
    expect(el.querySelector("svg")).toBeNull();
  });

  it("renders the pace panel with chart, delta text, and heading", () => {
    const host = withFg();
    const el = renderPacePositionPanel(oneWeekSamples());
    host.appendChild(el);

    // The delta text surfaces "pace".
    expect(el.textContent).toContain("pace");
    // A chart body svg exists.
    expect(el.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
    // The PACE heading is present.
    expect(el.querySelector(".capacity-pace-heading")).not.toBeNull();
  });

  it("labels the x-axis ticks with current-week dates via the exported formatter", () => {
    const host = withFg();
    const el = renderPacePositionPanel(oneWeekSamples());
    host.appendChild(el);

    const weeklyResetsAt = new Date("2026-06-14T00:00:00Z");
    const expected = [0, 0.25, 0.5, 0.75, 1].map((f) =>
      formatWindowTick(fractionToWindowDate(f, weeklyResetsAt)),
    );

    const svg = el.querySelector(".chart-scroll-wrapper svg");
    expect(svg).not.toBeNull();
    const tickText = Array.from(svg!.querySelectorAll("text")).map((t) => t.textContent); // type-safety-ok: asserted not-null by the preceding expect
    for (const label of expected) {
      expect(tickText).toContain(label);
    }
  });

  it("shows a caption communicating the current-week-only validity", () => {
    const host = withFg();
    const el = renderPacePositionPanel(oneWeekSamples());
    host.appendChild(el);

    const caption = el.querySelector(".capacity-pace-caption");
    expect(caption).not.toBeNull();
    expect(caption!.textContent).toContain("current week"); // type-safety-ok: asserted not-null by the preceding expect
  });
});
