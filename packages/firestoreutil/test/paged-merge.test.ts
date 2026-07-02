import { describe, it, expect } from "vitest";
import {
  encodeCursor,
  decodeCursor,
  compareByAddedAtDescIdDesc,
  pagedMerge,
  DEFAULT_MEDIA_PAGE_SIZE,
  type MediaCursor,
} from "../src/paged-merge.js";

interface Item {
  id: string;
  addedAt: string;
}

const idOf = (t: Item) => t.id;
const keyOf = (t: Item): MediaCursor => ({ addedAt: t.addedAt, id: t.id });

// Sort a full set the way pagedMerge does (addedAt desc, id desc), for
// simulating a "next page" from a decoded cursor.
function sorted(items: Item[]): Item[] {
  return [...items].sort((a, b) => compareByAddedAtDescIdDesc(keyOf(a), keyOf(b)));
}

// Items strictly "after" the cursor in DESC order.
function afterCursor(items: Item[], cursor: MediaCursor): Item[] {
  return sorted(items).filter((it) => compareByAddedAtDescIdDesc(keyOf(it), cursor) > 0);
}

describe("DEFAULT_MEDIA_PAGE_SIZE", () => {
  it("is 24", () => {
    expect(DEFAULT_MEDIA_PAGE_SIZE).toBe(24);
  });
});

describe("cursor round-trip", () => {
  it("decodeCursor(encodeCursor(k)) deep-equals k", () => {
    const k: MediaCursor = { addedAt: "2026-03-01T00:00:00Z", id: "abc123" };
    expect(decodeCursor(encodeCursor(k))).toEqual(k);
  });
  it("round-trips values containing punctuation and unicode", () => {
    const k: MediaCursor = { addedAt: "2026-03-01T00:00:00.500Z", id: 'a"/\\:_-é' };
    expect(decodeCursor(encodeCursor(k))).toEqual(k);
  });
});

describe("compareByAddedAtDescIdDesc", () => {
  it("orders by addedAt descending first", () => {
    const older: MediaCursor = { addedAt: "2026-01-01T00:00:00Z", id: "z" };
    const newer: MediaCursor = { addedAt: "2026-02-01T00:00:00Z", id: "a" };
    // newer should sort BEFORE older => negative
    expect(compareByAddedAtDescIdDesc(newer, older)).toBeLessThan(0);
    expect(compareByAddedAtDescIdDesc(older, newer)).toBeGreaterThan(0);
  });
  it("breaks addedAt ties by id descending", () => {
    const a: MediaCursor = { addedAt: "2026-01-01T00:00:00Z", id: "aaa" };
    const b: MediaCursor = { addedAt: "2026-01-01T00:00:00Z", id: "bbb" };
    // "bbb" > "aaa" so bbb sorts first => compare(b,a) negative
    expect(compareByAddedAtDescIdDesc(b, a)).toBeLessThan(0);
    expect(compareByAddedAtDescIdDesc(a, b)).toBeGreaterThan(0);
  });
  it("returns 0 only when both fields are equal", () => {
    const a: MediaCursor = { addedAt: "2026-01-01T00:00:00Z", id: "same" };
    const b: MediaCursor = { addedAt: "2026-01-01T00:00:00Z", id: "same" };
    expect(compareByAddedAtDescIdDesc(a, b)).toBe(0);
  });
  it("uses code-unit ordering, NOT localeCompare", () => {
    // Uppercase 'B' (0x42) sorts before lowercase 'a' (0x61) by code unit,
    // but localeCompare (en) typically orders 'a' before 'B'. This proves the
    // comparator is byte/code-unit based.
    const at = "2026-01-01T00:00:00Z";
    const upperB: MediaCursor = { addedAt: at, id: "B" };
    const lowerA: MediaCursor = { addedAt: at, id: "a" };

    // Code-unit desc: "a" (0x61) > "B" (0x42), so "a" sorts first.
    expect("a" > "B").toBe(true);
    expect(compareByAddedAtDescIdDesc(lowerA, upperB)).toBeLessThan(0);

    // Divergence: by code unit "a" > "B", but localeCompare (en) puts "a"
    // before "B" ("a".localeCompare("B") < 0). If the comparator used
    // localeCompare it would order these the opposite way.
    expect("a".localeCompare("B")).toBeLessThan(0);

    // A whole-array check: sorting by our comparator matches manual code-unit desc.
    const ids = ["B", "a", "A", "b", "_", "0"];
    const items: Item[] = ids.map((id) => ({ id, addedAt: at }));
    const byComparator = sorted(items).map((i) => i.id);
    const byCodeUnitDesc = [...ids].sort((x, y) => (x > y ? -1 : x < y ? 1 : 0));
    expect(byComparator).toEqual(byCodeUnitDesc);
  });
});

describe("pagedMerge", () => {
  it("orders same-addedAt tie by id desc and cursor lands between page-cut items with no gap", () => {
    const at = "2026-01-01T00:00:00Z";
    // Six items sharing the same timestamp, distinct ids.
    const all: Item[] = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, addedAt: at }));
    const pageSize = 3;

    const page = pagedMerge([{ items: all, hasMore: false }], pageSize, idOf, keyOf);

    // id desc => f, e, d, c, b, a. First page = f, e, d.
    expect(page.items.map((i) => i.id)).toEqual(["f", "e", "d"]);
    expect(page.nextCursor).not.toBeNull();

    // Next page: everything strictly after the cursor. Must be c, b, a — no
    // gap (d not repeated) and no skip (c not dropped).
    const cursor = decodeCursor(page.nextCursor as string);
    expect(cursor).toEqual({ addedAt: at, id: "d" });
    const next = afterCursor(all, cursor).slice(0, pageSize);
    expect(next.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("dedups a duplicate across inputs on the page boundary exactly once", () => {
    const dup: Item = { id: "dup", addedAt: "2026-01-03T00:00:00Z" };
    const inputA: Item[] = [
      { id: "x", addedAt: "2026-01-05T00:00:00Z" },
      dup,
      { id: "y", addedAt: "2026-01-01T00:00:00Z" },
    ];
    const inputB: Item[] = [
      { id: "z", addedAt: "2026-01-04T00:00:00Z" },
      { ...dup },
    ];

    const page = pagedMerge(
      [
        { items: inputA, hasMore: false },
        { items: inputB, hasMore: false },
      ],
      10,
      idOf,
      keyOf,
    );

    const ids = page.items.map((i) => i.id);
    expect(ids).toEqual(["x", "z", "dup", "y"]);
    expect(ids.filter((id) => id === "dup")).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
  });

  it("keeps nextCursor NON-null when two full inputs dedup to exactly pageSize", () => {
    const pageSize = 3;
    const items: Item[] = [
      { id: "a", addedAt: "2026-01-03T00:00:00Z" },
      { id: "b", addedAt: "2026-01-02T00:00:00Z" },
      { id: "c", addedAt: "2026-01-01T00:00:00Z" },
    ];
    // Both inputs carry the SAME rows and BOTH claim more un-fetched rows.
    const page = pagedMerge(
      [
        { items, hasMore: true },
        { items: items.map((i) => ({ ...i })), hasMore: true },
      ],
      pageSize,
      idOf,
      keyOf,
    );

    expect(page.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    // distinctBuffer.length === pageSize, so moreInBuffer is false, but an
    // input hasMore, so the cursor must survive.
    expect(page.nextCursor).not.toBeNull();
  });

  it("returns null nextCursor on a short final page (fewer than pageSize, no hasMore)", () => {
    const items: Item[] = [
      { id: "a", addedAt: "2026-01-02T00:00:00Z" },
      { id: "b", addedAt: "2026-01-01T00:00:00Z" },
    ];
    const page = pagedMerge([{ items, hasMore: false }], 5, idOf, keyOf);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it("returns null nextCursor on an empty page even if an input hasMore", () => {
    const page = pagedMerge([{ items: [], hasMore: true }], 5, idOf, keyOf);
    expect(page.items).toHaveLength(0);
    expect(page.nextCursor).toBeNull();
  });
});
