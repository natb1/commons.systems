import { describe, it, expect } from "vitest";
import { renderAuditAggregateChart } from "../src/audit-aggregate-chart.js";
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

/**
 * A multi-window fixture. Phase keys vary across windows (the union defines the
 * line set), and cache counts vary so the hit-rate trend moves.
 */
function multiAggregate(): AuditAggregate[] {
  return [
    make({
      computedAt: new Date("2026-06-07T00:00:00Z"),
      phaseSpend: { plan: 1.5, implement: 3.2 },
      cacheRead: 800,
      cacheCreation: 200,
    }),
    make({
      computedAt: new Date("2026-06-14T00:00:00Z"),
      phaseSpend: { plan: 2.1, implement: 4.0, review: 1.1 },
      cacheRead: 600,
      cacheCreation: 400,
    }),
    make({
      computedAt: new Date("2026-06-21T00:00:00Z"),
      phaseSpend: { implement: 5.5, review: 2.0 },
      cacheRead: 900,
      cacheCreation: 100,
    }),
  ];
}

function withFg(): HTMLElement {
  // happy-dom has no stylesheet, so missing.css's --fg is absent — set it on
  // the container so getThemeFg reads it live (mirrors the sibling test host).
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#ddd");
  document.body.appendChild(container);
  return container;
}

describe("renderAuditAggregateChart", () => {
  it("renders both stacked sub-charts, each with a fixed axis and a scroll wrapper", () => {
    const host = withFg();
    const el = renderAuditAggregateChart(multiAggregate());
    host.appendChild(el);

    // Two sub-charts → two layout blocks, each with its own axis + body SVG.
    expect(el.querySelectorAll(".chart-layout").length).toBe(2);
    expect(el.querySelectorAll(".chart-y-axis svg").length).toBe(2);
    expect(el.querySelectorAll(".chart-scroll-wrapper svg").length).toBe(2);
  });

  it("shows the empty-state message for an empty array", () => {
    const el = renderAuditAggregateChart([]);
    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No audit history to chart.");
    expect(el.querySelector("svg")).toBeNull();
  });

  it("includes the hit-rate entry and every phase in the legend", () => {
    withFg();
    const el = renderAuditAggregateChart(multiAggregate());

    const legend = el.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const labels = Array.from(legend!.querySelectorAll(".trend-legend-item")).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toContain("cache hit %");
    // Union of phase keys across all windows.
    expect(labels).toContain("plan");
    expect(labels).toContain("implement");
    expect(labels).toContain("review");
  });

  it("does not mutate the input array order", () => {
    withFg();
    // Deliberately unsorted input.
    const a = make({ computedAt: new Date("2026-06-21T00:00:00Z") });
    const b = make({ computedAt: new Date("2026-06-07T00:00:00Z") });
    const c = make({ computedAt: new Date("2026-06-14T00:00:00Z") });
    const aggregates = [a, b, c];
    const originalRefs = aggregates.map((x) => x);

    renderAuditAggregateChart(aggregates);

    expect(aggregates[0]).toBe(originalRefs[0]);
    expect(aggregates[1]).toBe(originalRefs[1]);
    expect(aggregates[2]).toBe(originalRefs[2]);
  });
});
