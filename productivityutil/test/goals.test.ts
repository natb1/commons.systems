import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

import { Timestamp } from "firebase/firestore";
import { requireGoal } from "../src/goals";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const createdAt = Timestamp.fromDate(new Date("2026-04-01T00:00:00Z"));

const base = {
  title: "Ship productivity MVP",
  horizon: "quarterly",
  priority: 1,
  status: "active",
  progress: 25,
  groupId: "household",
  memberEmails: ["alice@example.com"],
  createdAt,
};

describe("requireGoal", () => {
  it("returns typed Goal for valid data", () => {
    const g = requireGoal("goal-1", base);
    expect(g.id).toBe("goal-1");
    expect(g.title).toBe("Ship productivity MVP");
    expect(g.horizon).toBe("quarterly");
    expect(g.priority).toBe(1);
    expect(g.progress).toBe(25);
  });

  it("accepts weekly and yearly horizons", () => {
    expect(requireGoal("g", { ...base, horizon: "weekly" }).horizon).toBe("weekly");
    expect(requireGoal("g", { ...base, horizon: "yearly" }).horizon).toBe("yearly");
  });

  it("accepts done and dropped statuses", () => {
    expect(requireGoal("g", { ...base, status: "done" }).status).toBe("done");
    expect(requireGoal("g", { ...base, status: "dropped" }).status).toBe("dropped");
  });

  it("accepts progress at bounds", () => {
    expect(requireGoal("g", { ...base, progress: 0 }).progress).toBe(0);
    expect(requireGoal("g", { ...base, progress: 100 }).progress).toBe(100);
  });

  it("throws on progress below 0", () => {
    expect(() => requireGoal("g", { ...base, progress: -1 })).toThrow(DataIntegrityError);
  });

  it("throws on progress above 100", () => {
    expect(() => requireGoal("g", { ...base, progress: 101 })).toThrow(DataIntegrityError);
  });

  it("throws on negative priority", () => {
    expect(() => requireGoal("g", { ...base, priority: -1 })).toThrow(DataIntegrityError);
  });

  it("throws on unknown horizon", () => {
    expect(() => requireGoal("g", { ...base, horizon: "monthly" })).toThrow(DataIntegrityError);
  });

  it("throws on unknown status", () => {
    expect(() => requireGoal("g", { ...base, status: "paused" })).toThrow(DataIntegrityError);
  });
});
