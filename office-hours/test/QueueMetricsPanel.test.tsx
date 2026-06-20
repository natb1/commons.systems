import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { QueueMetricsPanel } from "../src/components/QueueMetricsPanel.js";
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

afterEach(() => cleanup());

describe("QueueMetricsPanel with populated metrics", () => {
  it("renders a heading with text QUEUE", () => {
    const { container } = render(<QueueMetricsPanel metrics={baseMetrics} />);
    const heading = container.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("QUEUE");
  });

  it("renders the queue depth value", () => {
    const { container } = render(<QueueMetricsPanel metrics={baseMetrics} />);
    const card = container.querySelector(".queue-depth-card");
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain("12");
  });

  it("renders the net drain value formatted to one decimal with /day", () => {
    const { container } = render(<QueueMetricsPanel metrics={baseMetrics} />);
    const card = container.querySelector(".queue-drain-card");
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain("1.5/day");
  });

  it("renders the runway value as 'N days' when runwayDays is a number", () => {
    const { container } = render(<QueueMetricsPanel metrics={baseMetrics} />);
    const card = container.querySelector(".queue-runway-card");
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain("8 days");
  });

  it("renders three capacity cards", () => {
    const { container } = render(<QueueMetricsPanel metrics={baseMetrics} />);
    const cards = container.querySelectorAll(".capacity-card");
    expect(cards).toHaveLength(3);
  });
});

describe("QueueMetricsPanel with runwayDays: null", () => {
  it("renders 'growing' in the runway value when runwayDays is null", () => {
    const metrics: QueueMetricsSnapshot = { ...baseMetrics, runwayDays: null, netDrainPerDay: -0.5 };
    const { container } = render(<QueueMetricsPanel metrics={metrics} />);
    const card = container.querySelector(".queue-runway-card");
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain("growing");
  });
});

describe("QueueMetricsPanel with negative runwayDays", () => {
  it("renders 'growing' when runwayDays is negative", () => {
    const metrics: QueueMetricsSnapshot = { ...baseMetrics, runwayDays: -5, netDrainPerDay: -0.5 };
    const { container } = render(<QueueMetricsPanel metrics={metrics} />);
    const card = container.querySelector(".queue-runway-card");
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain("growing");
  });
});

describe("QueueMetricsPanel with null metrics", () => {
  it("renders the queue-metrics-heading", () => {
    const { container } = render(<QueueMetricsPanel metrics={null} />);
    const heading = container.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("QUEUE");
  });

  it("renders the empty placeholder with correct text", () => {
    const { container } = render(<QueueMetricsPanel metrics={null} />);
    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No queue metrics yet.");
  });

  it("renders no capacity cards", () => {
    const { container } = render(<QueueMetricsPanel metrics={null} />);
    const cards = container.querySelectorAll(".capacity-card");
    expect(cards).toHaveLength(0);
  });
});
