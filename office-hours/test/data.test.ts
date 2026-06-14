import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { registerErrorSink, type EnrichedErrorContext } from "@commons-systems/errorutil/log";
import { toReminder, getOwnerQueueMetrics } from "../src/data.js";
import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const getDocMock = vi.fn();
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(() => ({})),
    getDoc: (...args: unknown[]) => getDocMock(...args),
  };
});

type SinkCall = { error: unknown; context: EnrichedErrorContext };

let captured: SinkCall[];

beforeEach(() => {
  captured = [];
  getDocMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  registerErrorSink((error, context) => {
    captured.push({ error, context });
  });
});

afterEach(() => {
  registerErrorSink(undefined);
  vi.restoreAllMocks();
});

const validData = {
  title: "Fix bug",
  repo: "natb1/commons.systems",
  issueNumber: 42,
  dueAt: { toDate: () => new Date("2026-01-01T00:00:00Z") },
};

describe("toReminder", () => {
  it("(a) missing jitKey — returns reminder with jitKey === id and logs the fallback", () => {
    const id = "doc-id-abc";
    const data = { ...validData };
    const reminder = toReminder(id, data);

    expect(reminder).not.toBeNull();
    if (reminder === null) return;

    expect(reminder.jitKey).toBe(id);
    expect(captured).toHaveLength(1);
    expect((captured[0].error as Error).message).toMatch(/jitKey/);
    expect((captured[0].error as Error).message).toMatch(/falling back/);
    expect(captured[0].context.operation).toBe("reminder-validation");
    expect(captured[0].context.itemId).toBe(id);
  });

  it("(b) missing required field — returns null, logs missing-required-fields, NOT jitKey-fallback", () => {
    const data = {
      // title intentionally omitted
      repo: "natb1/commons.systems",
      issueNumber: 42,
      dueAt: { toDate: () => new Date("2026-01-01T00:00:00Z") },
    };
    const id = "doc-id-xyz";
    const result = toReminder(id, data);

    expect(result).toBeNull();
    expect(captured).toHaveLength(1);
    expect((captured[0].error as Error).message).toMatch(/missing required fields/);
    expect((captured[0].error as Error).message).not.toMatch(/jitKey/);
    expect(captured[0].context.operation).toBe("reminder-validation");
    expect(captured[0].context.itemId).toBe(id);
  });

  it("(c) present jitKey — returns reminder with correct jitKey, sink NOT fired", () => {
    const id = "doc-id-def";
    const data = { ...validData, jitKey: "issues/natb1/commons.systems/99" };
    const reminder = toReminder(id, data);

    expect(reminder).not.toBeNull();
    if (reminder === null) return;

    expect(reminder.jitKey).toBe("issues/natb1/commons.systems/99");
    expect(captured).toHaveLength(0);
  });
});

describe("getOwnerQueueMetrics", () => {
  const db = {} as unknown as Firestore;
  const namespace = "test-ns" as unknown as import("@commons-systems/firestoreutil/namespace").Namespace;
  const user = { email: "a@b.com" } as unknown as User;

  it("(a) permission-denied — returns null", async () => {
    getDocMock.mockRejectedValue({ code: "permission-denied" });
    await expect(getOwnerQueueMetrics(db, namespace, user)).resolves.toBeNull();
  });

  it("(b) other error — rethrows", async () => {
    getDocMock.mockRejectedValue({ code: "unavailable" });
    await expect(getOwnerQueueMetrics(db, namespace, user)).rejects.toMatchObject({ code: "unavailable" });
  });
});
