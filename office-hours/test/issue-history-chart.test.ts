import { describe, it, expect } from "vitest";
import { renderIssueHistoryChart } from "../src/issue-history-chart.js";
import type { IssueSample } from "../src/issue-samples.js";

function withFg(): HTMLElement {
  // happy-dom has no stylesheet, so missing CSS's --fg is absent — set it on
  // the container explicitly so getThemeFg reads it live.
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#ddd");
  document.body.appendChild(container);
  return container;
}

/** Draining fixture: total descending over consecutive days. */
const drainingFixture: IssueSample[] = [
  { sampledAt: new Date("2026-06-07T00:00:00Z"), openSecurity: 2, openBug: 8, openEnhancement: 8, openOther: 5, groupId: "g" },
  { sampledAt: new Date("2026-06-08T00:00:00Z"), openSecurity: 2, openBug: 7, openEnhancement: 6, openOther: 4, groupId: "g" },
  { sampledAt: new Date("2026-06-09T00:00:00Z"), openSecurity: 1, openBug: 6, openEnhancement: 5, openOther: 3, groupId: "g" },
  { sampledAt: new Date("2026-06-10T00:00:00Z"), openSecurity: 1, openBug: 4, openEnhancement: 4, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-11T00:00:00Z"), openSecurity: 1, openBug: 3, openEnhancement: 2, openOther: 1, groupId: "g" },
];

/** Flat fixture: constant total → stable. */
const flatFixture: IssueSample[] = [
  { sampledAt: new Date("2026-06-07T00:00:00Z"), openSecurity: 1, openBug: 5, openEnhancement: 4, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-08T00:00:00Z"), openSecurity: 1, openBug: 5, openEnhancement: 4, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-09T00:00:00Z"), openSecurity: 1, openBug: 5, openEnhancement: 4, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-10T00:00:00Z"), openSecurity: 1, openBug: 5, openEnhancement: 4, openOther: 2, groupId: "g" },
];

/** Growing fixture: total ascending → growing. */
const growingFixture: IssueSample[] = [
  { sampledAt: new Date("2026-06-07T00:00:00Z"), openSecurity: 1, openBug: 2, openEnhancement: 2, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-08T00:00:00Z"), openSecurity: 1, openBug: 4, openEnhancement: 3, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-09T00:00:00Z"), openSecurity: 1, openBug: 5, openEnhancement: 5, openOther: 3, groupId: "g" },
  { sampledAt: new Date("2026-06-10T00:00:00Z"), openSecurity: 2, openBug: 7, openEnhancement: 6, openOther: 3, groupId: "g" },
];

describe("renderIssueHistoryChart", () => {
  it("layout present (draining fixture)", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(drainingFixture);
    host.appendChild(el);

    expect(el.querySelector(".chart-layout")).not.toBeNull();
    expect(el.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(el.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
  });

  it("empty-state: .empty paragraph, no svg, container still has backlog-history class", () => {
    const el = renderIssueHistoryChart([]);

    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No backlog history to chart.");
    expect(el.querySelector("svg")).toBeNull();
    expect(el.classList.contains("backlog-history")).toBe(true);
  });

  it("single sample (total > 0): empty-state, no degenerate chart", () => {
    // A lone sample yields a zero-width time domain — the degenerate xDomain
    // edge case. The guard must short-circuit to the empty state rather than
    // constructing a [d, d] domain through the stacked-area path.
    const host = withFg();
    const single: IssueSample[] = [
      { sampledAt: new Date("2026-06-07T00:00:00Z"), openSecurity: 1, openBug: 3, openEnhancement: 3, openOther: 2, groupId: "g" },
    ];
    const el = renderIssueHistoryChart(single);
    host.appendChild(el);

    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No backlog history to chart.");
    expect(el.querySelector("svg")).toBeNull();
    expect(el.querySelector(".chart-layout")).toBeNull();
    expect(el.classList.contains("backlog-history")).toBe(true);
  });

  it("stacked areas: chart-body svg contains at least 4 path elements (one per bucket)", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(drainingFixture);
    host.appendChild(el);

    const paths = el.querySelectorAll(".chart-scroll-wrapper svg path");
    expect(paths.length).toBeGreaterThanOrEqual(4);
  });

  it("legend has five entries: security, bug, enhancement, other, projection", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(drainingFixture);
    host.appendChild(el);

    const legend = el.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const labels = Array.from(legend!.querySelectorAll(".trend-legend-item")).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toEqual(["security", "bug", "enhancement", "other", "projection"]);
  });

  it("draining: caption state is draining with correct text; legend projection entry is dashed", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(drainingFixture);
    host.appendChild(el);

    const stateSpan = el.querySelector(".backlog-runway-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toMatch(/until the queue empties/);
    expect(stateSpan!.classList.contains("draining")).toBe(true);

    const legend = el.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const projItem = Array.from(legend!.querySelectorAll(".trend-legend-item")).find(
      (i) => (i.textContent ?? "") === "projection",
    );
    expect(projItem).not.toBeUndefined();
    const swatch = projItem!.querySelector(".legend-line") as HTMLElement;
    expect(swatch.style.backgroundImage).toContain("repeating-linear-gradient");
  });

  it("flat → stable: caption state is stable with correct text", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(flatFixture);
    host.appendChild(el);

    const stateSpan = el.querySelector(".backlog-runway-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("queue stable");
    expect(stateSpan!.classList.contains("stable")).toBe(true);
  });

  it("growing → growing: caption state is growing, no NaN or Infinity in text", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(growingFixture);
    host.appendChild(el);

    const stateSpan = el.querySelector(".backlog-runway-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("queue growing");
    expect(stateSpan!.classList.contains("growing")).toBe(true);

    const text = stateSpan!.textContent ?? "";
    expect(text).not.toMatch(/NaN|Infinity/);
  });
});
