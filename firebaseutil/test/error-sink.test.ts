import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve()),
  Timestamp: { now: vi.fn(() => ({ seconds: 1000 })) },
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  nsCollectionPath: vi.fn((ns: string, col: string) => `${ns}/${col}`),
}));

import { createFirestoreErrorSink } from "../src/error-sink.js";
import type { ErrorSinkOptions } from "../src/error-sink.js";
import type { EnrichedErrorContext } from "@commons-systems/errorutil/log";
import { addDoc } from "firebase/firestore";

const mockAddDoc = addDoc as ReturnType<typeof vi.fn>;

function makeOptions(overrides?: Partial<ErrorSinkOptions>): ErrorSinkOptions {
  return {
    db: {} as ErrorSinkOptions["db"],
    namespace: "testapp/prod" as unknown as ErrorSinkOptions["namespace"],
    ...overrides,
  };
}

function makeContext(overrides?: Partial<EnrichedErrorContext>): EnrichedErrorContext {
  return { operation: "test-op", kind: "unknown", ...overrides };
}

function getWrittenDoc(): Record<string, unknown> {
  return mockAddDoc.mock.calls[0]![1] as Record<string, unknown>;
}

describe("createFirestoreErrorSink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("writes error document to Firestore", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext());

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const doc = getWrittenDoc();
    expect(doc.message).toBe("boom");
    expect(doc.operation).toBe("test-op");
    expect(doc.kind).toBe("unknown");
  });

  it("extracts message from Error objects", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("test message"), makeContext());

    const doc = getWrittenDoc();
    expect(doc.message).toBe("test message");
    expect(doc.stack).toEqual(expect.stringContaining("test message"));
  });

  it("converts non-Error values to string message", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink("string error", makeContext());

    const doc = getWrittenDoc();
    expect(doc.message).toBe("string error");
    expect(doc.stack).toBeNull();
  });

  it("includes user info when getCurrentUser returns a user", () => {
    const sink = createFirestoreErrorSink(makeOptions({
      getCurrentUser: () => ({ uid: "u1", email: "test@example.com" }),
    }));
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect(doc.uid).toBe("u1");
    expect(doc.email).toBe("test@example.com");
  });

  it("sets uid/email to null when getCurrentUser returns null", () => {
    const sink = createFirestoreErrorSink(makeOptions({
      getCurrentUser: () => null,
    }));
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect(doc.uid).toBeNull();
    expect(doc.email).toBeNull();
  });

  it("sets uid/email to null when getCurrentUser is not provided", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect(doc.uid).toBeNull();
    expect(doc.email).toBeNull();
  });

  it("filters RESERVED_KEYS from extra context", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const ctx: EnrichedErrorContext = { operation: "test-op", kind: "unknown", customField: "kept" };
    (ctx as Record<string, unknown>).message = "override";
    sink(new Error("boom"), ctx);

    const doc = getWrittenDoc();
    expect(doc.message).toBe("boom"); // from Error, not context
    expect(doc.customField).toBe("kept");
  });

  it("passes extra context fields through", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), { operation: "test-op", kind: "unknown", postId: "abc", txnId: "123" });

    const doc = getWrittenDoc();
    expect(doc.postId).toBe("abc");
    expect(doc.txnId).toBe("123");
  });

  it("rate-limits after 50 writes within a window", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    for (let i = 0; i < 55; i++) {
      sink(new Error(`error ${i}`), makeContext());
    }

    expect(mockAddDoc).toHaveBeenCalledTimes(50);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("rate limit reached"),
    );
  });

  it("logs rate limit warning only once per window", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    for (let i = 0; i < 55; i++) {
      sink(new Error(`error ${i}`), makeContext());
    }

    const rateLimitWarnings = warnSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && (call[0] as string).includes("rate limit"),
    );
    expect(rateLimitWarnings).toHaveLength(1);
  });

  it("warns on Firestore write failure", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockAddDoc.mockRejectedValueOnce(new Error("firestore down"));

    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext());

    await new Promise((r) => setTimeout(r, 0));

    expect(warnSpy).toHaveBeenCalledWith(
      "Firestore error sink: failed to write error document",
      expect.any(Error),
    );
  });

  it("extracts error code when present", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const err = Object.assign(new Error("denied"), { code: "permission-denied" });
    sink(err, makeContext());

    const doc = getWrittenDoc();
    expect(doc.code).toBe("permission-denied");
  });
});
