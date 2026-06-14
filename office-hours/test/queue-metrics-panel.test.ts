import { describe, it, expect } from "vitest";
import { renderQueueMetricsPanel } from "../src/queue-metrics-panel.js";
import { type QueueMetricsSnapshot } from "../src/queue-metrics.js";

const baseMetrics: QueueMetricsSnapshot = {
  openHelpWanted: 12,
  closedPerDay: 3.5,
  createdPerDay: 2.0,
  netDrainPerDay: 1.5,
  runwayDays: 8,
  windowDays: 14,
  computedAt: new Date("2026-06-14T00:00:00Z"),
  groupId: "group-abc",
  memberEmails: ["alice@example.com"],
};

const now = new Date("2026-06-14T06:00:00Z");

describe("renderQueueMetricsPanel with populated metrics", () => {
  it("renders a heading with text QUEUE", () => {
    const section = renderQueueMetricsPanel(baseMetrics, now);
    const heading = section.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("QUEUE");
  });

  it("renders the queue depth value", () => {
    const section = renderQueueMetricsPanel(baseMetrics, now);
    const value = section.querySelector(".queue-depth-value");
    expect(value).not.toBeNull();
    expect(value!.textContent).toBe("12");
  });

  it("renders the net drain value formatted to one decimal with /day", () => {
    const section = renderQueueMetricsPanel(baseMetrics, now);
    const value = section.querySelector(".queue-drain-value");
    expect(value).not.toBeNull();
    expect(value!.textContent).toBe("1.5/day");
  });

  it("renders the runway value as 'N days' when runwayDays is a number", () => {
    const section = renderQueueMetricsPanel(baseMetrics, now);
    const value = section.querySelector(".queue-runway-value");
    expect(value).not.toBeNull();
    expect(value!.textContent).toContain("8 days");
  });

  it("renders three capacity cards", () => {
    const section = renderQueueMetricsPanel(baseMetrics, now);
    const cards = section.querySelectorAll(".capacity-card");
    expect(cards).toHaveLength(3);
  });
});

describe("renderQueueMetricsPanel with runwayDays: null", () => {
  it("renders 'growing' in the runway value when runwayDays is null", () => {
    const metrics: QueueMetricsSnapshot = { ...baseMetrics, runwayDays: null, netDrainPerDay: -0.5 };
    const section = renderQueueMetricsPanel(metrics, now);
    const value = section.querySelector(".queue-runway-value");
    expect(value).not.toBeNull();
    expect(value!.textContent).toBe("growing");
  });
});

describe("renderQueueMetricsPanel with null metrics", () => {
  it("renders the queue-metrics-heading", () => {
    const section = renderQueueMetricsPanel(null, now);
    const heading = section.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("QUEUE");
  });

  it("renders the empty placeholder with correct text", () => {
    const section = renderQueueMetricsPanel(null, now);
    const empty = section.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No queue metrics yet.");
  });

  it("renders no capacity cards", () => {
    const section = renderQueueMetricsPanel(null, now);
    const cards = section.querySelectorAll(".capacity-card");
    expect(cards).toHaveLength(0);
  });
});
