import { describe, it, expect } from "vitest";
import { selectLatestSample, renderCapacityBand } from "../src/capacity-band.js";
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

describe("selectLatestSample", () => {
  it("returns null for an empty array", () => {
    expect(selectLatestSample([])).toBeNull();
  });

  it("returns the sample with the maximum sampledAt from an unordered array", () => {
    const a = make({ sampledAt: new Date("2026-06-07T08:00:00Z") });
    const b = make({ sampledAt: new Date("2026-06-07T12:00:00Z") });
    const c = make({ sampledAt: new Date("2026-06-07T10:00:00Z") });
    const samples = [a, b, c];

    const result = selectLatestSample(samples);
    expect(result).toBe(b);
  });

  it("does not mutate the input array", () => {
    const a = make({ sampledAt: new Date("2026-06-07T08:00:00Z") });
    const b = make({ sampledAt: new Date("2026-06-07T12:00:00Z") });
    const c = make({ sampledAt: new Date("2026-06-07T10:00:00Z") });
    const samples = [a, b, c];
    const originalRefs = samples.map((s) => s);

    selectLatestSample(samples);

    // Input array order is unchanged
    expect(samples[0]).toBe(originalRefs[0]);
    expect(samples[1]).toBe(originalRefs[1]);
    expect(samples[2]).toBe(originalRefs[2]);
  });
});

describe("renderCapacityBand with sample", () => {
  // Use a `now` well before both resets so countdowns are positive
  const now = new Date("2026-06-07T09:00:00Z");

  it("renders two cards with correct percentage values", () => {
    const sample = make({ fiveHourUsedPct: 42.5, weeklyUsedPct: 18.3 });
    const section = renderCapacityBand(sample, now);

    const values = section.querySelectorAll(".capacity-card-value");
    expect(values).toHaveLength(2);
    expect(values[0].textContent).toBe(`${Math.round(42.5)}%`);
    expect(values[1].textContent).toBe(`${Math.round(18.3)}%`);
  });

  it("renders two reset list items", () => {
    const section = renderCapacityBand(make(), now);
    const items = section.querySelectorAll(".capacity-resets li");
    expect(items).toHaveLength(2);
  });

  it("sub-hour countdown formats as 'in Nm' (the <HOUR branch)", () => {
    // fiveHourResetsAt is 30 minutes after `now`
    const subHourNow = new Date("2026-06-07T14:30:00Z");
    const sample = make({ fiveHourResetsAt: new Date("2026-06-07T15:00:00Z") });
    const section = renderCapacityBand(sample, subHourNow);

    const fiveHourItem = section.querySelector(".capacity-resets li");
    const countdown = fiveHourItem!.querySelector(".capacity-reset-countdown");
    expect(countdown!.textContent).toBe("in 30m");
  });

  it("each reset li has a non-empty clock and a countdown matching /^in \\d/ or 'now'", () => {
    const section = renderCapacityBand(make(), now);
    const items = section.querySelectorAll(".capacity-resets li");

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
    const section = renderCapacityBand(sample, now);

    const fiveHourItem = section.querySelector(".capacity-resets li");
    const countdown = fiveHourItem!.querySelector(".capacity-reset-countdown");
    expect(countdown!.textContent).toBe("now");
  });
});

describe("renderCapacityBand worker-state branches", () => {
  const now = new Date("2026-06-07T09:00:00Z");

  it('target === 0 → state "paused"', () => {
    const sample = make({ activeWorkers: 0, targetWorkers: 0 });
    const section = renderCapacityBand(sample, now);

    const stateSpan = section.querySelector(".capacity-worker-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("paused");

    const workersText = section.querySelector(".capacity-workers")!.textContent ?? "";
    expect(workersText).toContain("0 active / 0 target");
  });

  it('active < target → state "spawning"', () => {
    const sample = make({ activeWorkers: 1, targetWorkers: 3 });
    const section = renderCapacityBand(sample, now);

    const stateSpan = section.querySelector(".capacity-worker-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("spawning");

    const workersText = section.querySelector(".capacity-workers")!.textContent ?? "";
    expect(workersText).toContain("1 active / 3 target");
  });

  it('active >= target (target > 0) → state "steady"', () => {
    const sample = make({ activeWorkers: 3, targetWorkers: 2 });
    const section = renderCapacityBand(sample, now);

    const stateSpan = section.querySelector(".capacity-worker-state");
    expect(stateSpan).not.toBeNull();
    expect(stateSpan!.textContent).toBe("steady");

    const workersText = section.querySelector(".capacity-workers")!.textContent ?? "";
    expect(workersText).toContain("3 active / 2 target");
  });

  it("worker-state span also has the state string as a CSS class", () => {
    const sample = make({ activeWorkers: 1, targetWorkers: 3 });
    const section = renderCapacityBand(sample, now);

    const stateSpan = section.querySelector(".capacity-worker-state");
    expect(stateSpan!.classList.contains("spawning")).toBe(true);
  });
});

describe("renderCapacityBand(null, now)", () => {
  const now = new Date("2026-06-07T09:00:00Z");

  it("renders the empty placeholder and no capacity cards", () => {
    const section = renderCapacityBand(null, now);

    const empty = section.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No capacity data.");

    const cards = section.querySelectorAll(".capacity-card");
    expect(cards).toHaveLength(0);
  });
});
