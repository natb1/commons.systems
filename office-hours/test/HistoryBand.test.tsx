// @vitest-environment happy-dom
//
// The <HistoryBand> chart-panel component (Unit 3). It wraps the two imperative
// Observable Plot cores (renderUsageHistoryChart / renderWorkerHistoryChart) as
// chart islands. These assert the e2e-load-bearing structure preserved from the
// vanilla renderHistoryBand — section.capacity-history, the HISTORY heading, the
// two .chart-layout blocks, and the delegated per-core empty-state copy.
//
// happy-dom loads no stylesheet, so the cores' theme-var reads resolve to
// fallbacks unless mocked. We mock --fg and the DS --chart-1..6 palette on the
// document root so readThemeVar/readChartPalette return real values (the cores
// read them off their freshly-created element, which inherits the root vars).
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { HistoryBand } from "../src/components/HistoryBand.js";
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

const multiSample: UsageSample[] = [
  make({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
  make({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  make({ sampledAt: new Date("2026-06-09T10:00:00Z"), activeWorkers: 4, targetWorkers: 4 }),
];

// Mock the theme tokens the cores read: --fg plus the DS --chart-1..6 palette.
beforeEach(() => {
  const root = document.documentElement.style;
  root.setProperty("--fg", "#e8eaed");
  root.setProperty("--chart-1", "#4d6f8f");
  root.setProperty("--chart-2", "#c98a3c");
  root.setProperty("--chart-3", "#a35d5d");
  root.setProperty("--chart-4", "#7a8c5a");
  root.setProperty("--chart-5", "#b08a4f");
  root.setProperty("--chart-6", "#5f8a8a");
});
afterEach(() => {
  cleanup();
  const root = document.documentElement.style;
  for (const v of ["--fg", "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"]) {
    root.removeProperty(v);
  }
});

describe("HistoryBand", () => {
  it("renders section.capacity-history with the HISTORY heading", () => {
    const { container } = render(<HistoryBand samples={multiSample} />);
    const section = container.querySelector("section.capacity-history");
    expect(section).not.toBeNull();
    const heading = section!.querySelector(".capacity-history-heading");
    expect(heading).not.toBeNull();
    expect(heading!.tagName).toBe("H2");
    expect(heading!.textContent).toBe("HISTORY");
  });

  it("renders both chart layouts from a multi-sample array", () => {
    const { container } = render(<HistoryBand samples={multiSample} />);
    expect(container.querySelectorAll(".chart-layout")).toHaveLength(2);
    expect(container.querySelectorAll(".chart-scroll-wrapper svg")).toHaveLength(2);
  });

  it("delegates empty-state to the cores for an empty array", () => {
    const { container } = render(<HistoryBand samples={[]} />);
    // Heading is still present.
    expect(container.querySelector(".capacity-history-heading")!.textContent).toBe("HISTORY");
    expect(container.querySelectorAll(".chart-layout")).toHaveLength(0);
    const empties = container.querySelectorAll(".empty");
    expect(empties).toHaveLength(2);
    expect(empties[0].textContent).toBe("No usage history to chart.");
    expect(empties[1].textContent).toBe("No worker history to chart.");
  });

  it("draws series strokes using the mocked DS palette (no leftover ad-hoc hexes)", () => {
    const { container } = render(<HistoryBand samples={multiSample} />);
    // The legend swatches reflect the per-series colors read from the palette.
    const lines = Array.from(container.querySelectorAll(".trend-legend .legend-line")) as HTMLElement[];
    const colors = lines.map((l) => l.style.backgroundColor + l.style.backgroundImage).join(" ");
    // Amber (--chart-2) is the leading series; teal (--chart-6) the second.
    expect(colors).toMatch(/201, 138, 60|rgb\(201, 138, 60\)|#c98a3c/i);
    expect(colors).toMatch(/95, 138, 138|rgb\(95, 138, 138\)|#5f8a8a/i);
  });

  it("tears down the prior render on unmount (island cleanup)", () => {
    const { container, unmount } = render(<HistoryBand samples={multiSample} />);
    expect(container.querySelectorAll(".chart-layout")).toHaveLength(2);
    unmount();
    // After unmount the islands' hosts are removed with the component subtree.
    expect(container.querySelectorAll(".chart-layout")).toHaveLength(0);
  });
});
