import { describe, it, expect } from "vitest";
import { renderIssueHistoryChart } from "../src/issue-history-chart.js";
import type { IssueSample } from "../src/issue-samples.js";

const now = new Date("2026-06-14T00:00:00Z");

function withFg(): HTMLElement {
  // happy-dom has no stylesheet, so missing CSS's --fg is absent — set it on
  // the container explicitly so getThemeFg reads it live.
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#ddd");
  document.body.appendChild(container);
  return container;
}

/** Draining fixture: openHelpWanted descending over consecutive days. */
const drainingFixture: IssueSample[] = [
  { sampledAt: new Date("2026-06-07T00:00:00Z"), openHelpWanted: 18, openOther: 5, groupId: "g" },
  { sampledAt: new Date("2026-06-08T00:00:00Z"), openHelpWanted: 15, openOther: 4, groupId: "g" },
  { sampledAt: new Date("2026-06-09T00:00:00Z"), openHelpWanted: 12, openOther: 3, groupId: "g" },
  { sampledAt: new Date("2026-06-10T00:00:00Z"), openHelpWanted: 9, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-11T00:00:00Z"), openHelpWanted: 6, openOther: 1, groupId: "g" },
];

/** Flat fixture: constant openHelpWanted → stable. */
const flatFixture: IssueSample[] = [
  { sampledAt: new Date("2026-06-07T00:00:00Z"), openHelpWanted: 10, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-08T00:00:00Z"), openHelpWanted: 10, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-09T00:00:00Z"), openHelpWanted: 10, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-10T00:00:00Z"), openHelpWanted: 10, openOther: 2, groupId: "g" },
];

/** Growing fixture: openHelpWanted ascending → growing. */
const growingFixture: IssueSample[] = [
  { sampledAt: new Date("2026-06-07T00:00:00Z"), openHelpWanted: 5, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-08T00:00:00Z"), openHelpWanted: 8, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-09T00:00:00Z"), openHelpWanted: 11, openOther: 3, groupId: "g" },
  { sampledAt: new Date("2026-06-10T00:00:00Z"), openHelpWanted: 15, openOther: 3, groupId: "g" },
];

describe("renderIssueHistoryChart", () => {
  it("layout present (draining fixture)", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(drainingFixture, now);
    host.appendChild(el);

    expect(el.querySelector(".chart-layout")).not.toBeNull();
    expect(el.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(el.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
  });

  it("empty-state: .empty paragraph, no svg, container still has backlog-history class", () => {
    const el = renderIssueHistoryChart([], now);

    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No backlog history to chart.");
    expect(el.querySelector("svg")).toBeNull();
    expect(el.classList.contains("backlog-history")).toBe(true);
  });

  it("stacked areas: chart-body svg contains at least 2 path elements", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(drainingFixture, now);
    host.appendChild(el);

    const paths = el.querySelectorAll(".chart-scroll-wrapper svg path");
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it("draining: caption state is draining with correct text; legend projection entry is dashed", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(drainingFixture, now);
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
    const el = renderIssueHistoryChart(flatFixture, now);
    host.appendChild(el);

    const stateSpan = el.querySelector(".backlog-runway-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("queue stable");
    expect(stateSpan!.classList.contains("stable")).toBe(true);
  });

  it("growing → growing: caption state is growing, no NaN or Infinity in text", () => {
    const host = withFg();
    const el = renderIssueHistoryChart(growingFixture, now);
    host.appendChild(el);

    const stateSpan = el.querySelector(".backlog-runway-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("queue growing");
    expect(stateSpan!.classList.contains("growing")).toBe(true);

    const text = stateSpan!.textContent ?? "";
    expect(text).not.toMatch(/NaN|Infinity/);
  });
});
