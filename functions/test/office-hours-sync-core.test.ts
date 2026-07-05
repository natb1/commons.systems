import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase-admin/firestore";

vi.mock("firebase-admin/firestore", () => {
  const TimestampImpl = {
    fromDate: (d: Date) => ({ toDate: () => d, _seconds: d.getTime() / 1000 }),
  };
  return {
    getFirestore: vi.fn(),
    Timestamp: TimestampImpl,
    FieldValue: { serverTimestamp: () => "__server_timestamp__" },
  };
});

import {
  syncOfficeHoursCore,
  parseJitDueMarker,
  type ReminderItem,
} from "../src/office-hours-sync-core";
import { truncateForLog } from "../src/log-utils";

interface InMemoryDocRef {
  path: string;
  set: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
}

function createInMemoryFirestore(
  opts: {
    failBulkWriterSetFor?: (ref: InMemoryDocRef) => boolean;
    failBulkWriterDeleteFor?: (ref: InMemoryDocRef) => boolean;
  } = {},
) {
  const docs = new Map<string, Record<string, unknown>>();

  const doc = (path: string): InMemoryDocRef => ({
    path,
    set: (data: Record<string, unknown>) => {
      docs.set(path, data);
      return Promise.resolve();
    },
    delete: () => {
      docs.delete(path);
      return Promise.resolve();
    },
  });

  const collection = (path: string) => ({
    get: async () => ({
      docs: [...docs.entries()]
        .filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
        .map(([key, data]) => ({
          id: key.slice(path.length + 1),
          ref: doc(key),
          data: () => data,
        })),
    }),
    doc: (id: string) => doc(`${path}/${id}`),
  });

  // Deliberate regression guard: enforces Firestore's real 500-op WriteBatch cap
  // so reverting production to a single batch fails the >500-op sync test.
  const batch = () => {
    const ops: Array<() => void> = [];
    let opCount = 0;
    const guard = () => {
      opCount += 1;
      if (opCount > 500) {
        throw new Error("INVALID_ARGUMENT: maximum 500 writes allowed per request");
      }
    };
    return {
      set: (ref: InMemoryDocRef, data: Record<string, unknown>) => {
        guard();
        ops.push(() => docs.set(ref.path, data));
      },
      delete: (ref: InMemoryDocRef) => {
        guard();
        ops.push(() => docs.delete(ref.path));
      },
      commit: async () => {
        for (const op of ops) op();
      },
    };
  };

  const bulkWriter = () => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: InMemoryDocRef, data: Record<string, unknown>) => {
        if (opts.failBulkWriterSetFor?.(ref)) {
          return Promise.reject(
            new Error("BulkWriter set failed: simulated per-op write failure"),
          );
        }
        ops.push(() => docs.set(ref.path, data));
        return Promise.resolve();
      },
      delete: (ref: InMemoryDocRef) => {
        if (opts.failBulkWriterDeleteFor?.(ref)) {
          return Promise.reject(
            new Error("BulkWriter delete failed: simulated per-op delete failure"),
          );
        }
        ops.push(() => docs.delete(ref.path));
        return Promise.resolve();
      },
      close: async () => {
        for (const op of ops) op();
      },
    };
  };

  return { doc, collection, batch, bulkWriter, _docs: docs };
}

function makeIssue(overrides: Partial<ReminderItem> = {}): ReminderItem {
  return {
    kind: "reminder",
    number: 1,
    title: "Daily chore",
    body: "Recurring daily chore. Close when done.",
    jitKey: "daily-chore",
    repo: "natb1/office-hours-nate",
    dueAt: new Date("2026-01-15T12:00:00Z"),
    ...overrides,
  };
}

describe("syncOfficeHoursCore", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("writes one item per open jit issue with a due time", async () => {
    const store = createInMemoryFirestore();
    const issue = makeIssue({
      number: 42,
      jitKey: "daily-chore",
      dueAt: new Date("2026-01-15T12:00:00Z"),
    });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [issue],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result).toEqual({
      written: 1,
      deleted: 0,
      skippedNoDate: 0,
    });

    const written = store._docs.get("office-hours/prod/items/daily-chore") as Record<
      string,
      unknown
    > & { dueAt: { toDate: () => Date } };
    expect(written.kind).toBe("reminder");
    expect(written.title).toBe("Daily chore");
    expect(written.repo).toBe("natb1/office-hours-nate");
    expect(written.issueNumber).toBe(42);
    expect(written.jitKey).toBe("daily-chore");
    expect(written.memberEmails).toEqual(["owner@example.com"]);
    expect(written.updatedAt).toBe("__server_timestamp__");
    expect(written.dueAt.toDate().toISOString()).toBe("2026-01-15T12:00:00.000Z");
  });

  it("skips an issue with no due time", async () => {
    const store = createInMemoryFirestore();
    const withDate = makeIssue({ number: 1, jitKey: "daily-chore" });
    const noDate = makeIssue({ number: 2, jitKey: "budget-review", dueAt: null });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [withDate, noDate],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result).toEqual({
      written: 1,
      deleted: 0,
      skippedNoDate: 1,
    });
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(true);
    expect(store._docs.has("office-hours/prod/items/budget-review")).toBe(false);
  });

  it("deletes existing items not in the open set", async () => {
    const store = createInMemoryFirestore();
    store._docs.set("office-hours/prod/items/stale-key", {
      title: "Stale",
      jitKey: "stale-key",
    });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result).toEqual({
      written: 0,
      deleted: 1,
      skippedNoDate: 0,
    });
    expect(store._docs.has("office-hours/prod/items/stale-key")).toBe(false);
  });

  it("is idempotent: same input twice produces the same final state", async () => {
    const store = createInMemoryFirestore();
    const issue = makeIssue({ number: 10, jitKey: "daily-chore" });

    const deps = {
      fetchOpenJitIssues: async () => [issue],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    };

    const first = await syncOfficeHoursCore(deps);
    const second = await syncOfficeHoursCore(deps);

    expect(first).toEqual({
      written: 1,
      deleted: 0,
      skippedNoDate: 0,
    });
    expect(second).toEqual({
      written: 1,
      deleted: 0,
      skippedNoDate: 0,
    });
    expect(store._docs.size).toBe(1);
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(true);
  });

  it("skips an issue whose jitKey would escape the items collection", async () => {
    const store = createInMemoryFirestore();
    const valid = makeIssue({ number: 1, jitKey: "daily-chore" });
    const slash = makeIssue({ number: 2, jitKey: "a/b/c" });
    const dotdot = makeIssue({ number: 3, jitKey: ".." });
    const empty = makeIssue({ number: 4, jitKey: "" });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [valid, slash, dotdot, empty],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    // Only the valid key is written; the path-escaping / invalid keys are
    // skipped before any Firestore write, so no nested doc is created.
    expect(result).toEqual({ written: 1, deleted: 0, skippedNoDate: 0 });
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(true);
    expect(store._docs.has("office-hours/prod/items/a/b/c")).toBe(false);
    expect([...store._docs.keys()]).toEqual(["office-hours/prod/items/daily-chore"]);
  });

  it("propagates memberEmails onto each written item", async () => {
    const store = createInMemoryFirestore();
    const issue = makeIssue({ number: 7, jitKey: "daily-chore" });

    await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [issue],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["a@example.com", "b@example.com"],
    });

    const written = store._docs.get("office-hours/prod/items/daily-chore") as
      | Record<string, unknown>
      | undefined;
    expect(written?.memberEmails).toEqual(["a@example.com", "b@example.com"]);
  });

  it("handles more than 500 operations in a single sync", async () => {
    // Part 1: >500 set-only path — 600 writes in one sync run.
    // The regression guard: batch() throws on the 501st op, so a revert to
    // firestore.batch() fails here. BulkWriter chunks internally and passes.
    const store1 = createInMemoryFirestore();
    const issues = Array.from({ length: 600 }, (_, i) =>
      makeIssue({ number: i, jitKey: `k-${i}` }),
    );

    const result1 = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => issues,
      firestore: store1 as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result1.written).toBe(600);
    for (let i = 0; i < 600; i++) {
      expect(store1._docs.has(`office-hours/prod/items/k-${i}`)).toBe(true);
    }

    // Part 2: combined set+delete >500 path — 600 stale deletions + 5 fresh writes = 605 ops.
    const store2 = createInMemoryFirestore();
    for (let i = 0; i < 600; i++) {
      store2._docs.set(`office-hours/prod/items/stale-${i}`, {
        title: `Stale ${i}`,
        jitKey: `stale-${i}`,
      });
    }
    const freshIssues = Array.from({ length: 5 }, (_, i) =>
      makeIssue({ number: 700 + i, jitKey: `fresh-${i}` }),
    );

    const result2 = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => freshIssues,
      firestore: store2 as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result2.written).toBe(5);
    expect(result2.deleted).toBe(600);
    for (let i = 0; i < 600; i++) {
      expect(store2._docs.has(`office-hours/prod/items/stale-${i}`)).toBe(false);
    }
    for (let i = 0; i < 5; i++) {
      expect(store2._docs.has(`office-hours/prod/items/fresh-${i}`)).toBe(true);
    }
  });

  it("throws when a BulkWriter set() op fails — Promise.all(writes) re-raises it", async () => {
    // BulkWriter routes per-op failures to the individual set() promise, not to
    // close(); the failing op below leaves close() resolving cleanly. Only the
    // `await Promise.all(writes)` line in syncOfficeHoursCore re-raises it, so
    // deleting that line causes this test to fail — syncOfficeHoursCore no
    // longer throws, so .rejects.toThrow() fails — surfacing the regression.
    const store = createInMemoryFirestore({
      failBulkWriterSetFor: (ref) =>
        ref.path === "office-hours/prod/items/daily-chore",
    });
    const issue = makeIssue({ number: 1, jitKey: "daily-chore" });

    await expect(
      syncOfficeHoursCore({
        fetchOpenJitIssues: async () => [issue],
        firestore: store as unknown as Firestore,
        namespace: "office-hours/prod",
        memberEmails: ["owner@example.com"],
      }),
    ).rejects.toThrow(/simulated per-op write failure/);

    // The failed op must not have written its doc.
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(false);
  });

  it("throws when a BulkWriter delete() op fails — Promise.all(writes) re-raises it", async () => {
    // Mirrors the set()-failure guard for the delete path: a stale doc not in
    // the open set is enqueued via writer.delete(), whose per-op failure is
    // routed to its own promise (not close()). Only the `await Promise.all(writes)`
    // line re-raises it, so deleting that line causes this test to fail —
    // syncOfficeHoursCore no longer throws, so .rejects.toThrow() fails.
    const store = createInMemoryFirestore({
      failBulkWriterDeleteFor: (ref) =>
        ref.path === "office-hours/prod/items/stale-key",
    });
    store._docs.set("office-hours/prod/items/stale-key", {
      title: "Stale",
      jitKey: "stale-key",
    });

    await expect(
      syncOfficeHoursCore({
        fetchOpenJitIssues: async () => [],
        firestore: store as unknown as Firestore,
        namespace: "office-hours/prod",
        memberEmails: ["owner@example.com"],
      }),
    ).rejects.toThrow(/simulated per-op delete failure/);

    // The failed op must not have deleted its doc.
    expect(store._docs.has("office-hours/prod/items/stale-key")).toBe(true);
  });
});

describe("parseJitDueMarker", () => {
  it("parses a well-formed marker", () => {
    const body = "Body text\n\n<!-- jit-due: 2026-01-15T12:00:00Z -->";
    const result = parseJitDueMarker(body);
    expect(result?.toISOString()).toBe("2026-01-15T12:00:00.000Z");
  });

  it("tolerates extra whitespace inside the marker", () => {
    const body = "<!--   jit-due:   2026-02-01T00:00:00Z   -->";
    const result = parseJitDueMarker(body);
    expect(result?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("returns null when no marker is present", () => {
    expect(parseJitDueMarker("Plain body, no marker.")).toBeNull();
  });

  it("returns null when the marker is malformed", () => {
    expect(parseJitDueMarker("<!-- jit-due: not-a-date -->")).toBeNull();
  });
});

describe("truncateForLog", () => {
  it("passes an empty string through unchanged", () => {
    expect(truncateForLog("")).toBe("");
  });

  it("passes a string of exactly max length through unchanged", () => {
    const result = truncateForLog("a".repeat(200));
    expect(result).toBe("a".repeat(200));
    expect(result).not.toContain("…[truncated]");
  });

  it("truncates a string one character over max to max chars plus the suffix", () => {
    expect(truncateForLog("a".repeat(201))).toBe("a".repeat(200) + "…[truncated]");
  });

  it("truncates a string significantly longer than max correctly", () => {
    const result = truncateForLog("b".repeat(1000));
    expect(result).toBe("b".repeat(200) + "…[truncated]");
    expect(result.length).toBe(200 + 12);
    expect(result.slice(0, 200)).toBe("b".repeat(200));
  });

  it("respects an explicit max override", () => {
    expect(truncateForLog("x".repeat(50), 10)).toBe("x".repeat(10) + "…[truncated]");
  });
});
