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
import { requireFeedEntry } from "../src/feed-entries";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const publishedAt = Timestamp.fromDate(new Date("2026-04-15T12:00:00Z"));
const createdAt = Timestamp.fromDate(new Date("2026-04-15T12:05:00Z"));

const base = {
  source: "rss",
  sourceKey: "overreacted",
  title: "A post",
  url: "https://overreacted.io/a-post",
  snippet: "...",
  publishedAt,
  read: false,
  saved: false,
  groupId: "household",
  memberEmails: ["alice@example.com"],
  createdAt,
};

describe("requireFeedEntry", () => {
  it("returns typed FeedEntry for valid data", () => {
    const entry = requireFeedEntry("entry-1", base);
    expect(entry.id).toBe("entry-1");
    expect(entry.source).toBe("rss");
    expect(entry.sourceKey).toBe("overreacted");
    expect(entry.read).toBe(false);
    expect(entry.saved).toBe(false);
  });

  it("accepts hackernews source", () => {
    expect(requireFeedEntry("e", { ...base, source: "hackernews" }).source).toBe("hackernews");
  });

  it("accepts reddit source", () => {
    expect(requireFeedEntry("e", { ...base, source: "reddit" }).source).toBe("reddit");
  });

  it("throws on unknown source", () => {
    expect(() => requireFeedEntry("e", { ...base, source: "mastodon" })).toThrow(DataIntegrityError);
  });

  it("throws on non-boolean read", () => {
    expect(() => requireFeedEntry("e", { ...base, read: "false" })).toThrow(DataIntegrityError);
  });

  it("throws on non-Timestamp publishedAt", () => {
    expect(() => requireFeedEntry("e", { ...base, publishedAt: null })).toThrow(DataIntegrityError);
  });

  it("throws on missing url", () => {
    expect(() => requireFeedEntry("e", { ...base, url: undefined })).toThrow(DataIntegrityError);
  });
});
