import { describe, it, expect } from "vitest";
import { renderHistoryBand } from "../src/history-band.js";
import { type UsageSample } from "../src/usage-samples.js";

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

const make = (o: Partial<UsageSample> = {}): UsageSample => ({ ...baseSample, ...o });

// The chart modules read --fg via getThemeFg; happy-dom has no stylesheet, so
// set it on the document root before rendering (mirrors budget's makeContainer).
function withThemeFg<T>(fn: () => T): T {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
  try {
    return fn();
  } finally {
    document.documentElement.style.removeProperty("--fg");
  }
}

const multiSample: UsageSample[] = [
  make({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
  make({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  make({ sampledAt: new Date("2026-06-09T10:00:00Z"), activeWorkers: 4, targetWorkers: 4 }),
];

describe("renderHistoryBand", () => {
  it("renders the capacity-history section", () => {
    const band = withThemeFg(() => renderHistoryBand(multiSample));
    expect(band.tagName).toBe("SECTION");
    expect(band.classList.contains("capacity-history")).toBe(true);
  });

  it("renders the HISTORY heading with the expected class and text", () => {
    const band = withThemeFg(() => renderHistoryBand(multiSample));
    const heading = band.querySelector(".capacity-history-heading");
    expect(heading).not.toBeNull();
    expect(heading!.tagName).toBe("H2");
    expect(heading!.textContent).toBe("HISTORY");
  });

  it("renders both chart layouts from a multi-sample array", () => {
    const band = withThemeFg(() => renderHistoryBand(multiSample));
    // Each chart module wraps its plot in a .chart-layout element.
    const layouts = band.querySelectorAll(".chart-layout");
    expect(layouts).toHaveLength(2);
  });

  it("delegates empty-state to the chart modules for an empty array", () => {
    const band = withThemeFg(() => renderHistoryBand([]));
    // Heading is still present.
    const heading = band.querySelector(".capacity-history-heading");
    expect(heading!.textContent).toBe("HISTORY");
    // Both charts render their own empty-state element instead of a layout.
    expect(band.querySelectorAll(".chart-layout")).toHaveLength(0);
    const empties = band.querySelectorAll(".empty");
    expect(empties).toHaveLength(2);
    expect(empties[0].textContent).toBe("No usage history to chart.");
    expect(empties[1].textContent).toBe("No worker history to chart.");
  });
});
