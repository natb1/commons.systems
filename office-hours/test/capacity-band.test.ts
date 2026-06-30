import { describe, it, expect } from "vitest";
import { renderCapacityBand, capacityBandKey } from "../src/capacity-band.js";
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

describe("capacityBandKey", () => {
  it("returns empty string when sample is null", () => {
    const now = new Date("2026-06-07T09:00:00Z");
    expect(capacityBandKey(null, now)).toBe("");
  });

  it("is stable across a no-boundary 60s step", () => {
    // now = 2026-06-07T09:00:30Z (half-minute offset keeps countdown floors
    // away from integer boundaries across a +60s step)
    // fiveHourResetsAt = 2026-06-07T15:00:00Z → delta ≈ 5h59m30s (sub-day, >=HOUR)
    //   → floor(delta/HOUR)=5, floor((delta%HOUR)/MINUTE)=59 → "in 5h 59m"
    //   at +60s: delta ≈ 5h58m30s → floor=5h, floor=58m → "in 5h 58m" — NOT STABLE
    // Use weeklyResetsAt = 2026-06-14T00:00:00Z → delta ≈ 6d15h → "in 6d 15h"
    //   at +60s: delta ≈ 6d14h59m → floor(delta/DAY)=6, floor((delta%DAY)/HOUR)=14 — crosses hour!
    //
    // Safer: pick now far from any sub-unit boundary.
    // fiveHourResetsAt = 2026-06-10T09:00:30Z → delta from now = exactly 3 days
    //   Use now = 2026-06-07T09:00:30Z, fiveHourResetsAt = 2026-06-10T10:30:30Z
    //   delta = 3d 1h 30m → "in 3d 1h"
    //   at +60s: delta = 3d 1h 29m → floor(delta/DAY)=3, floor((delta%DAY)/HOUR)=1 → "in 3d 1h" STABLE
    // weeklyResetsAt = 2026-06-14T12:00:30Z
    //   delta from now = 7d 3h → "in 7d 3h"
    //   at +60s: 7d 2h 59m → floor=7d, floor=2h — crosses hour boundary!
    //
    // Key insight: the "in Dd Hh" branch uses floor((delta%DAY)/HOUR).
    // A +60s step changes the hour floor only if delta%DAY is within 60s of a whole hour.
    // Pick now and resets so both deltas%DAY are far from whole-hour marks.
    //
    // now = 2026-06-07T09:00:30Z
    // fiveHourResetsAt = 2026-06-10T10:30:30Z → delta = 3*DAY + 1*HOUR + 30*MINUTE
    //   delta%DAY = 1h 30m = 5400000ms, floor(5400000/HOUR)=1 → "in 3d 1h"
    //   at +60s: delta%DAY = 1h 29m = 5340000ms, floor=1 → still "in 3d 1h" STABLE ✓
    // weeklyResetsAt = 2026-06-14T11:30:30Z → delta = 7*DAY + 2*HOUR + 30*MINUTE
    //   delta%DAY = 2h 30m = 9000000ms, floor=2 → "in 7d 2h"
    //   at +60s: delta%DAY = 2h 29m = 8940000ms, floor=2 → still "in 7d 2h" STABLE ✓
    const now = new Date("2026-06-07T09:00:30Z");
    const sample = make({
      fiveHourResetsAt: new Date("2026-06-10T10:30:30Z"),
      weeklyResetsAt: new Date("2026-06-14T11:30:30Z"),
    });
    const key1 = capacityBandKey(sample, now);
    const key2 = capacityBandKey(sample, new Date(now.getTime() + 60_000));
    expect(key1).toBe(key2);
  });

  it("changes when a countdown crosses a minute boundary", () => {
    // fiveHourResetsAt = now + 150_000ms → delta=150000 → floor(150000/60000)=2 → "in 2m"
    // at now+60s: delta=90000 → floor=1 → "in 1m"
    // weeklyResetsAt far out and unchanged across the step
    const now = new Date("2026-06-07T09:00:00Z");
    const fiveHourResetsAt = new Date(now.getTime() + 150_000);
    const sample = make({
      fiveHourResetsAt,
      weeklyResetsAt: new Date("2026-06-14T11:30:30Z"),
    });
    const key1 = capacityBandKey(sample, now);
    const key2 = capacityBandKey(sample, new Date(now.getTime() + 60_000));
    expect(key1).not.toBe(key2);
  });
});
