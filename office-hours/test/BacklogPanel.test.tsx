// @vitest-environment happy-dom
//
// The <BacklogPanel> chart-panel component (Unit 3). It wraps the imperative
// renderIssueHistoryChart core as a chart island. Asserts the e2e-load-bearing
// structure preserved from the vanilla core — .backlog-history, .chart-layout,
// the runway caption, the dashed projection legend entry — and the delegated
// empty-state copy. Mocks --fg + the DS --chart-1..6 palette on the document
// root so the core's theme-var reads resolve.
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BacklogPanel } from "../src/components/BacklogPanel.js";
import type { IssueSample } from "../src/issue-samples.js";

/** Draining fixture: openHelpWanted descending over consecutive days. */
const drainingFixture: IssueSample[] = [
  { sampledAt: new Date("2026-06-07T00:00:00Z"), openHelpWanted: 18, openOther: 5, groupId: "g" },
  { sampledAt: new Date("2026-06-08T00:00:00Z"), openHelpWanted: 15, openOther: 4, groupId: "g" },
  { sampledAt: new Date("2026-06-09T00:00:00Z"), openHelpWanted: 12, openOther: 3, groupId: "g" },
  { sampledAt: new Date("2026-06-10T00:00:00Z"), openHelpWanted: 9, openOther: 2, groupId: "g" },
  { sampledAt: new Date("2026-06-11T00:00:00Z"), openHelpWanted: 6, openOther: 1, groupId: "g" },
];

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

describe("BacklogPanel", () => {
  it("renders the .backlog-history chart layout (draining fixture)", () => {
    const { container } = render(<BacklogPanel samples={drainingFixture} />);
    expect(container.querySelector(".backlog-history")).not.toBeNull();
    expect(container.querySelector(".chart-layout")).not.toBeNull();
    expect(container.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
  });

  it("delegates empty-state to the core for an empty array", () => {
    const { container } = render(<BacklogPanel samples={[]} />);
    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No backlog history to chart.");
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector(".backlog-history")).not.toBeNull();
  });

  it("draining: caption state is draining; legend projection entry is dashed", () => {
    const { container } = render(<BacklogPanel samples={drainingFixture} />);
    const stateSpan = container.querySelector(".backlog-runway-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toMatch(/until the queue empties/);
    expect(stateSpan!.classList.contains("draining")).toBe(true);

    const projItem = Array.from(container.querySelectorAll(".trend-legend-item")).find(
      (i) => (i.textContent ?? "") === "projection",
    );
    expect(projItem).not.toBeUndefined();
    const swatch = projItem!.querySelector(".legend-line") as HTMLElement;
    expect(swatch.style.backgroundImage).toContain("repeating-linear-gradient");
  });

  it("tears down the prior render on unmount", () => {
    const { container, unmount } = render(<BacklogPanel samples={drainingFixture} />);
    expect(container.querySelector(".chart-layout")).not.toBeNull();
    unmount();
    expect(container.querySelector(".chart-layout")).toBeNull();
  });
});
