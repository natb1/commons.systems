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
import { requireAgendaItem } from "../src/agenda-items";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const createdAt = Timestamp.fromDate(new Date("2026-04-17T00:00:00Z"));
const scheduledAt = Timestamp.fromDate(new Date("2026-04-18T09:00:00Z"));

const base = {
  title: "Write plan",
  notes: "",
  scheduledAt,
  status: "todo",
  groupId: "household",
  memberEmails: ["alice@example.com", "bob@example.com"],
  createdAt,
};

describe("requireAgendaItem", () => {
  it("returns typed AgendaItem for valid data", () => {
    const item = requireAgendaItem("item-1", base);
    expect(item.id).toBe("item-1");
    expect(item.title).toBe("Write plan");
    expect(item.status).toBe("todo");
    expect(item.groupId).toBe("household");
    expect(item.memberEmails).toEqual(["alice@example.com", "bob@example.com"]);
    expect(item.scheduledAt).toBe(scheduledAt);
    expect(item.createdAt).toBe(createdAt);
  });

  it("accepts null scheduledAt", () => {
    const item = requireAgendaItem("item-2", { ...base, scheduledAt: null });
    expect(item.scheduledAt).toBeNull();
  });

  it("accepts 'done' status", () => {
    const item = requireAgendaItem("item-3", { ...base, status: "done" });
    expect(item.status).toBe("done");
  });

  it("throws on missing title", () => {
    expect(() => requireAgendaItem("item-4", { ...base, title: undefined })).toThrow(DataIntegrityError);
  });

  it("throws on invalid status", () => {
    expect(() => requireAgendaItem("item-5", { ...base, status: "archived" })).toThrow(DataIntegrityError);
  });

  it("throws on missing createdAt", () => {
    expect(() => requireAgendaItem("item-6", { ...base, createdAt: null })).toThrow(DataIntegrityError);
  });

  it("throws on non-Timestamp scheduledAt", () => {
    expect(() => requireAgendaItem("item-7", { ...base, scheduledAt: "2026-04-18" })).toThrow(DataIntegrityError);
  });

  it("throws on non-array memberEmails", () => {
    expect(() => requireAgendaItem("item-8", { ...base, memberEmails: "alice@example.com" })).toThrow(DataIntegrityError);
  });

  it("throws on non-string entry in memberEmails", () => {
    expect(() => requireAgendaItem("item-9", { ...base, memberEmails: ["alice@example.com", 42] })).toThrow(DataIntegrityError);
  });

  it("throws on non-object data", () => {
    expect(() => requireAgendaItem("item-10", null)).toThrow(TypeError);
  });
});
