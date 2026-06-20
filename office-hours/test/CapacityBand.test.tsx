import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CapacityBand } from "../src/components/CapacityBand.js";
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

afterEach(() => cleanup());

describe("CapacityBand with sample", () => {
  // Use a `now` well before both resets so countdowns are positive
  const now = new Date("2026-06-07T09:00:00Z");

  it("renders two cards with correct percentage values", () => {
    const sample = make({ fiveHourUsedPct: 42.5, weeklyUsedPct: 18.3 });
    const { container } = render(<CapacityBand sample={sample} now={now} />);

    const cards = container.querySelectorAll(".capacity-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain(`${Math.round(42.5)}%`);
    expect(cards[1].textContent).toContain(`${Math.round(18.3)}%`);
  });

  it("renders two reset list items", () => {
    const { container } = render(<CapacityBand sample={make()} now={now} />);
    const items = container.querySelectorAll(".capacity-resets li");
    expect(items).toHaveLength(2);
  });

  it("sub-hour countdown formats as 'in Nm' (the <HOUR branch)", () => {
    // fiveHourResetsAt is 30 minutes after `now`
    const subHourNow = new Date("2026-06-07T14:30:00Z");
    const sample = make({ fiveHourResetsAt: new Date("2026-06-07T15:00:00Z") });
    const { container } = render(<CapacityBand sample={sample} now={subHourNow} />);

    const fiveHourItem = container.querySelector(".capacity-resets li");
    const countdown = fiveHourItem!.querySelector(".capacity-reset-countdown");
    expect(countdown!.textContent).toBe("in 30m");
  });

  it("each reset li has a non-empty clock and a countdown matching /^in \\d/ or 'now'", () => {
    const { container } = render(<CapacityBand sample={make()} now={now} />);
    const items = container.querySelectorAll(".capacity-resets li");

    for (const li of Array.from(items)) {
      const clock = li.querySelector(".capacity-reset-clock");
      const countdown = li.querySelector(".capacity-reset-countdown");

      expect(clock).not.toBeNull();
      expect(clock!.textContent).toBeTruthy();

      expect(countdown).not.toBeNull();
      const countdownText = countdown!.textContent ?? "";
      expect(/^in \d/.test(countdownText) || countdownText === "now").toBe(true);
    }
  });

  it("a reset already in the past renders the countdown as 'now'", () => {
    // fiveHourResetsAt is one hour before `now`, so delta <= 0 → "now"
    const sample = make({ fiveHourResetsAt: new Date("2026-06-07T08:00:00Z") });
    const { container } = render(<CapacityBand sample={sample} now={now} />);

    const fiveHourItem = container.querySelector(".capacity-resets li");
    const countdown = fiveHourItem!.querySelector(".capacity-reset-countdown");
    expect(countdown!.textContent).toBe("now");
  });
});

describe("CapacityBand worker-state branches", () => {
  const now = new Date("2026-06-07T09:00:00Z");

  it('target === 0 → state "paused"', () => {
    const sample = make({ activeWorkers: 0, targetWorkers: 0 });
    const { container } = render(<CapacityBand sample={sample} now={now} />);

    const stateSpan = container.querySelector(".capacity-worker-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("paused");

    const workersText = container.querySelector(".capacity-workers")!.textContent ?? "";
    expect(workersText).toContain("0 active / 0 target");
  });

  it('active < target → state "spawning"', () => {
    const sample = make({ activeWorkers: 1, targetWorkers: 3 });
    const { container } = render(<CapacityBand sample={sample} now={now} />);

    const stateSpan = container.querySelector(".capacity-worker-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("spawning");

    const workersText = container.querySelector(".capacity-workers")!.textContent ?? "";
    expect(workersText).toContain("1 active / 3 target");
  });

  it('active >= target (target > 0) → state "steady"', () => {
    const sample = make({ activeWorkers: 3, targetWorkers: 2 });
    const { container } = render(<CapacityBand sample={sample} now={now} />);

    const stateSpan = container.querySelector(".capacity-worker-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("steady");

    const workersText = container.querySelector(".capacity-workers")!.textContent ?? "";
    expect(workersText).toContain("3 active / 2 target");
  });

  it("worker-state span also has the state string as a CSS class", () => {
    const sample = make({ activeWorkers: 1, targetWorkers: 3 });
    const { container } = render(<CapacityBand sample={sample} now={now} />);

    const stateSpan = container.querySelector(".capacity-worker-state");
    expect(stateSpan!.classList.contains("spawning")).toBe(true);
  });
});

describe("CapacityBand(null, now)", () => {
  const now = new Date("2026-06-07T09:00:00Z");

  it("renders the empty placeholder and no capacity cards", () => {
    const { container } = render(<CapacityBand sample={null} now={now} />);

    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No capacity data.");

    const cards = container.querySelectorAll(".capacity-card");
    expect(cards).toHaveLength(0);
  });
});
