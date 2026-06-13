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
    vi.unstubAllGlobals();
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

  it("filters RESERVED_KEYS from extra context and folds custom fields into extras", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const ctx: EnrichedErrorContext = { operation: "test-op", kind: "unknown", customField: "kept" };
    (ctx as Record<string, unknown>).message = "override";
    sink(new Error("boom"), ctx);

    const doc = getWrittenDoc();
    expect(doc.message).toBe("boom"); // from Error, not context
    // customField must be in extras JSON, not top-level
    expect(doc.customField).toBeUndefined();
    expect(JSON.parse(doc.extras as string).customField).toBe("kept");
  });

  it("folds extra context fields into extras as JSON, not top-level", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), { operation: "test-op", kind: "unknown", postId: "abc", txnId: "123" });

    const doc = getWrittenDoc();
    // Must NOT be top-level keys
    expect(doc.postId).toBeUndefined();
    expect(doc.txnId).toBeUndefined();
    // Must be in extras
    const extras = JSON.parse(doc.extras as string);
    expect(extras.postId).toBe("abc");
    expect(extras.txnId).toBe("123");
  });

  it("sets extras to null when there are no non-reserved context fields", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect(doc.extras).toBeNull();
  });

  it("drops a caller-supplied extras key (it is reserved) and does not corrupt synthesized extras", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    // extras is now a RESERVED_KEY so it should be filtered out
    const ctx = { operation: "test-op", kind: "unknown" } as EnrichedErrorContext;
    (ctx as Record<string, unknown>).extras = "caller-supplied";
    sink(new Error("boom"), ctx);

    const doc = getWrittenDoc();
    // The caller-supplied extras key was the only non-reserved-... key,
    // so synthesized extras should be null (no other non-reserved keys).
    expect(doc.extras).toBeNull();
  });

  it("truncates oversized message to 10000 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const longMessage = "a".repeat(15000);
    sink(new Error(longMessage), makeContext());

    const doc = getWrittenDoc();
    expect((doc.message as string).length).toBe(10000);
  });

  it("truncates oversized stack to 50000 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const err = new Error("boom");
    // Override stack with an oversized value
    Object.defineProperty(err, "stack", { value: "x".repeat(60000), configurable: true });
    sink(err, makeContext());

    const doc = getWrittenDoc();
    expect((doc.stack as string).length).toBe(50000);
  });

  it("truncates oversized kind to 32 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext({ kind: "a".repeat(50) as EnrichedErrorContext["kind"] }));

    const doc = getWrittenDoc();
    expect((doc.kind as string).length).toBe(32);
  });

  it("truncates oversized operation to 200 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext({ operation: "a".repeat(201) }));

    const doc = getWrittenDoc();
    expect((doc.operation as string).length).toBe(200);
  });

  it("truncates oversized code to 200 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const err = Object.assign(new Error("boom"), { code: "a".repeat(201) });
    sink(err, makeContext());

    const doc = getWrittenDoc();
    expect((doc.code as string).length).toBe(200);
  });

  it("truncates oversized url to 2000 characters", () => {
    vi.stubGlobal("location", { href: "a".repeat(2001) });
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect((doc.url as string).length).toBe(2000);
  });

  it("truncates oversized userAgent to 500 characters", () => {
    vi.stubGlobal("navigator", { userAgent: "a".repeat(501) });
    const sink = createFirestoreErrorSink(makeOptions());
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect((doc.userAgent as string).length).toBe(500);
  });

  it("truncates oversized uid to 128 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions({
      getCurrentUser: () => ({ uid: "a".repeat(129), email: "test@example.com" }),
    }));
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect((doc.uid as string).length).toBe(128);
  });

  it("truncates oversized email to 320 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions({
      getCurrentUser: () => ({ uid: "u1", email: "a".repeat(321) }),
    }));
    sink(new Error("boom"), makeContext());

    const doc = getWrittenDoc();
    expect((doc.email as string).length).toBe(320);
  });

  it("sets extras to null when serialized extras exceeds 10000 characters", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const ctx = { operation: "test-op", kind: "unknown", bigData: "x".repeat(10001) } as EnrichedErrorContext;
    sink(new Error("boom"), ctx);

    const doc = getWrittenDoc();
    expect(doc.extras).toBeNull();
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

  it("logs suppressed count when window resets", () => {
    const sink = createFirestoreErrorSink(makeOptions());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Fill the window
    for (let i = 0; i < 55; i++) {
      sink(new Error(`error ${i}`), makeContext());
    }

    // Advance past the 60s window
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61_000);
    sink(new Error("after window"), makeContext());

    const suppressedWarnings = warnSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && (call[0] as string).includes("5 errors suppressed"),
    );
    expect(suppressedWarnings).toHaveLength(1);
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

  describe("sensitive-key stripping", () => {
    it("strips a sensitive-named key (sessionToken) from doc.extras", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).sessionToken = "tok";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      expect(doc.sessionToken).toBeUndefined();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.sessionToken).toBeUndefined();
    });

    it("emits a console.warn naming the dropped sensitive key", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).sessionToken = "tok";
      sink(new Error("boom"), ctx);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("sessionToken"),
      );
    });

    it("retains a non-sensitive key (txnId) in doc.extras", () => {
      // Spy only to suppress the drop warning; restored in beforeEach.
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).sessionToken = "tok";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.txnId).toBe("123");
    });

    it("strips a key that contains a sensitive substring (apiKey matches 'key')", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).apiKey = "secret-api-key";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      expect(doc.apiKey).toBeUndefined();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.apiKey).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("apiKey"),
      );
    });

    it("strips a key with a PII substring (recipientEmail matches 'email')", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).recipientEmail = "victim@example.com";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      expect(doc.recipientEmail).toBeUndefined();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.recipientEmail).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("recipientEmail"));
    });

    it("strips a key with a PII substring (phoneNumber matches 'phone')", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).phoneNumber = "555-1234";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      expect(doc.phoneNumber).toBeUndefined();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.phoneNumber).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("phoneNumber"));
    });

    it("strips a key with a PII substring (userSsn matches 'ssn')", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).userSsn = "000-00-0000";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      expect(doc.userSsn).toBeUndefined();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.userSsn).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("userSsn"));
    });

    it("strips a key with a PII substring (userDob matches 'dob')", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).userDob = "1990-01-01";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      expect(doc.userDob).toBeUndefined();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.userDob).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("userDob"));
    });

    it("strips a key with a PII substring (mailingAddress matches 'address')", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).mailingAddress = "1 Main St";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      expect(doc.mailingAddress).toBeUndefined();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.mailingAddress).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("mailingAddress"));
    });

    it("retains a key containing 'adobe' (adobeId does not false-match 'dob')", () => {
      // Spy only to suppress any drop warning; restored in beforeEach.
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).adobeId = "font-42";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.adobeId).toBe("font-42");
    });

    it("retains an all-caps key containing 'ADOBE' (ADOBE does not false-match 'dob')", () => {
      // Spy only to suppress any drop warning; restored in beforeEach.
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const sink = createFirestoreErrorSink(makeOptions());
      const ctx = makeContext({ txnId: "123" } as Partial<EnrichedErrorContext>);
      (ctx as Record<string, unknown>).ADOBE = "font-42";
      sink(new Error("boom"), ctx);

      const doc = getWrittenDoc();
      const extras = JSON.parse(doc.extras as string);
      expect(extras.ADOBE).toBe("font-42");
    });
  });
});
