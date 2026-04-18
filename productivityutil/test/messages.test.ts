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
import { requireMessage } from "../src/messages";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const sentAt = Timestamp.fromDate(new Date("2026-04-10T08:00:00Z"));
const createdAt = Timestamp.fromDate(new Date("2026-04-10T08:01:00Z"));

const base = {
  source: "discord",
  sourceKey: "#general",
  sender: "alice",
  body: "hi there",
  sentAt,
  read: false,
  actioned: false,
  groupId: "household",
  memberEmails: ["alice@example.com"],
  createdAt,
};

describe("requireMessage", () => {
  it("returns typed Message for valid data", () => {
    const m = requireMessage("msg-1", base);
    expect(m.id).toBe("msg-1");
    expect(m.source).toBe("discord");
    expect(m.sender).toBe("alice");
    expect(m.body).toBe("hi there");
  });

  it("accepts email source", () => {
    expect(requireMessage("m", { ...base, source: "email" }).source).toBe("email");
  });

  it("accepts claude-session source", () => {
    expect(requireMessage("m", { ...base, source: "claude-session" }).source).toBe("claude-session");
  });

  it("throws on unknown source", () => {
    expect(() => requireMessage("m", { ...base, source: "sms" })).toThrow(DataIntegrityError);
  });

  it("throws on non-boolean actioned", () => {
    expect(() => requireMessage("m", { ...base, actioned: 1 })).toThrow(DataIntegrityError);
  });

  it("throws on missing sender", () => {
    expect(() => requireMessage("m", { ...base, sender: undefined })).toThrow(DataIntegrityError);
  });
});
