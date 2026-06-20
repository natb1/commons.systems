// @vitest-environment happy-dom
//
// The <PacePanel> chart-panel component (Unit 3). It wraps the imperative
// renderPacePositionPanel core as a chart island. Asserts the e2e-load-bearing
// structure preserved from the vanilla core — section.capacity-pace, the PACE
// heading, the chart body, the ahead/behind delta text — and the delegated
// empty-state copy. Mocks --fg + the DS --chart-1..6 palette on the root.
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PacePanel } from "../src/components/PacePanel.js";
import { type UsageSample } from "../src/usage-samples.js";

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

function oneWeekSamples(): UsageSample[] {
  return [
    make({ sampledAt: new Date("2026-06-09T00:00:00Z"), weeklyUsedPct: 20 }),
    make({ sampledAt: new Date("2026-06-12T00:00:00Z"), weeklyUsedPct: 55 }),
  ];
}

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

describe("PacePanel", () => {
  it("delegates empty-state to the core for an empty array", () => {
    const { container } = render(<PacePanel samples={[]} />);
    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No usage history to chart pace position.");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders the pace panel with heading, chart, and delta text", () => {
    const { container } = render(<PacePanel samples={oneWeekSamples()} />);
    expect(container.querySelector("section.capacity-pace")).not.toBeNull();
    expect(container.querySelector(".capacity-pace-heading")).not.toBeNull();
    expect(container.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
    expect(container.textContent).toContain("pace");
  });

  it("tears down the prior render on unmount", () => {
    const { container, unmount } = render(<PacePanel samples={oneWeekSamples()} />);
    expect(container.querySelector(".capacity-pace")).not.toBeNull();
    unmount();
    expect(container.querySelector(".capacity-pace")).toBeNull();
  });
});
