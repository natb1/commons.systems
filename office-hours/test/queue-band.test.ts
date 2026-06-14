import { describe, it, expect } from "vitest";
import { renderQueueBand } from "../src/queue-band.js";
import type { QueueMetricsSnapshot } from "../src/queue-metrics.js";

const baseMetrics: QueueMetricsSnapshot = {
  openHelpWanted: 12,
  closedPerDay: 1.5,
  createdPerDay: 1.0,
  netDrainPerDay: 0.5,
  runwayDays: 24,
  windowDays: 14,
  computedAt: new Date("2026-06-07T10:00:00Z"),
  groupId: "g",
  memberEmails: ["x@y"],
};

const make = (o: Partial<QueueMetricsSnapshot> = {}): QueueMetricsSnapshot => ({
  ...baseMetrics,
  ...o,
});

describe("renderQueueBand cards", () => {
  it("renders three cards with the backlog/closed/created values in order", () => {
    const section = renderQueueBand(make());

    const values = section.querySelectorAll(".queue-card-value");
    expect(values).toHaveLength(3);
    expect(values[0].textContent).toBe("12");
    expect(values[1].textContent).toBe("1.5");
    expect(values[2].textContent).toBe("1.0");
  });
});

describe("renderQueueBand runway readout", () => {
  it("draining: positive runway renders the days-until-empty phrase", () => {
    const section = renderQueueBand(make());

    const state = section.querySelector(".queue-runway-state");
    expect(state).not.toBeNull();
    expect(state!.textContent).toBe("~24 days until the queue empties");
    expect(state!.classList.contains("draining")).toBe(true);
  });

  it("ceil rounding: a fractional runway rounds up to ~1 day", () => {
    const section = renderQueueBand(make({ runwayDays: 0.6 }));

    const state = section.querySelector(".queue-runway-state");
    expect(state!.textContent).toBe("~1 day until the queue empties");
  });

  it("stable: null runway with zero net drain reads 'queue stable'", () => {
    const section = renderQueueBand(make({ runwayDays: null, netDrainPerDay: 0 }));

    const state = section.querySelector(".queue-runway-state");
    expect(state!.textContent).toBe("queue stable");
    expect(state!.classList.contains("stable")).toBe(true);
  });

  it("growing: null runway with negative net drain reads 'queue growing'", () => {
    const section = renderQueueBand(make({ runwayDays: null, netDrainPerDay: -0.5 }));

    const state = section.querySelector(".queue-runway-state");
    expect(state!.textContent).toBe("queue growing");
    expect(state!.classList.contains("growing")).toBe(true);
  });

  it("empty queue wins over null runway: 'queue empty'", () => {
    const section = renderQueueBand(
      make({ openHelpWanted: 0, runwayDays: null, netDrainPerDay: 0 }),
    );

    const state = section.querySelector(".queue-runway-state");
    expect(state!.textContent).toBe("queue empty");
    expect(state!.classList.contains("empty")).toBe(true);
  });

  it("never renders Infinity, NaN, or a negative number for the null-runway fixtures", () => {
    const fixtures = [
      make({ runwayDays: null, netDrainPerDay: 0 }),
      make({ runwayDays: null, netDrainPerDay: -0.5 }),
      make({ openHelpWanted: 0, runwayDays: null, netDrainPerDay: 0 }),
    ];

    for (const fixture of fixtures) {
      const section = renderQueueBand(fixture);
      const text = section.textContent ?? "";
      expect(/Infinity|NaN|-\d/.test(text)).toBe(false);
    }
  });
});

describe("renderQueueBand(null)", () => {
  it("renders the empty placeholder and no queue cards", () => {
    const section = renderQueueBand(null);

    const empty = section.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No queue data.");

    const cards = section.querySelectorAll(".queue-card");
    expect(cards).toHaveLength(0);
  });
});

describe("renderQueueBand heading", () => {
  it("renders the QUEUE heading", () => {
    const section = renderQueueBand(make());

    const heading = section.querySelector(".queue-heading");
    expect(heading!.textContent).toBe("QUEUE");
  });
});
