// @vitest-environment happy-dom
//
// The <AuditPanel> chart-panel component (Unit 3). It wraps the imperative
// renderAuditAggregateChart core (TWO stacked sub-charts + combined legend) as a
// chart island. Asserts both sub-charts render, the legend carries the hit-rate
// entry plus every phase, and the delegated empty-state copy. Mocks --fg + the
// DS --chart-1..6 palette on the document root.
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { AuditPanel } from "../src/components/AuditPanel.js";
import { type AuditAggregate } from "../src/audit-aggregates.js";

const baseAggregate: AuditAggregate = {
  computedAt: new Date("2026-06-07T00:00:00Z"),
  windowDays: 7,
  groupId: "group-abc",
  phaseSpend: { plan: 1.5, implement: 3.2, review: 0.8 },
  cacheRead: 800,
  cacheCreation: 200,
};
const make = (o: Partial<AuditAggregate> = {}): AuditAggregate => ({ ...baseAggregate, ...o });

function multiAggregate(): AuditAggregate[] {
  return [
    make({ computedAt: new Date("2026-06-07T00:00:00Z"), phaseSpend: { plan: 1.5, implement: 3.2 }, cacheRead: 800, cacheCreation: 200 }),
    make({ computedAt: new Date("2026-06-14T00:00:00Z"), phaseSpend: { plan: 2.1, implement: 4.0, review: 1.1 }, cacheRead: 600, cacheCreation: 400 }),
    make({ computedAt: new Date("2026-06-21T00:00:00Z"), phaseSpend: { implement: 5.5, review: 2.0 }, cacheRead: 900, cacheCreation: 100 }),
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

describe("AuditPanel", () => {
  it("renders both stacked sub-charts, each with a fixed axis and a scroll wrapper", () => {
    const { container } = render(<AuditPanel aggregates={multiAggregate()} />);
    expect(container.querySelectorAll(".chart-layout").length).toBe(2);
    expect(container.querySelectorAll(".chart-y-axis svg").length).toBe(2);
    expect(container.querySelectorAll(".chart-scroll-wrapper svg").length).toBe(2);
  });

  it("delegates empty-state to the core for an empty array", () => {
    const { container } = render(<AuditPanel aggregates={[]} />);
    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No audit history to chart.");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("delegates the not-enough-history copy for a single aggregate", () => {
    const { container } = render(<AuditPanel aggregates={[make()]} />);
    const empty = container.querySelector(".empty");
    expect(empty!.textContent).toBe(
      "Not enough audit history to chart — waiting for a second window.",
    );
  });

  it("legend carries the hit-rate entry and every phase", () => {
    const { container } = render(<AuditPanel aggregates={multiAggregate()} />);
    const labels = Array.from(container.querySelectorAll(".trend-legend-item")).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toContain("cache hit %");
    expect(labels).toContain("plan");
    expect(labels).toContain("implement");
    expect(labels).toContain("review");
  });

  it("tears down the prior render on unmount", () => {
    const { container, unmount } = render(<AuditPanel aggregates={multiAggregate()} />);
    expect(container.querySelectorAll(".chart-layout").length).toBe(2);
    unmount();
    expect(container.querySelectorAll(".chart-layout").length).toBe(0);
  });
});
