import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { registerErrorSink, type EnrichedErrorContext } from "@commons-systems/errorutil/log";
import { toReminder } from "../src/data.js";

type SinkCall = { error: unknown; context: EnrichedErrorContext };

let captured: SinkCall[];

beforeEach(() => {
  captured = [];
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

const validMergePrData = {
  kind: "merge-pr" as const,
  title: "Fix flaky test",
  repo: "natb1/commons.systems",
  issueNumber: 7,
  prTitle: "fix: stop the flakiness",
  prUrl: "https://github.com/natb1/commons.systems/pull/9",
  prNumber: 9,
  prRepo: "natb1/commons.systems",
};

describe("toReminder merge-pr", () => {
  it("(a) valid merge-pr doc — returns MergePrItem with all PR fields, sink NOT fired", () => {
    const id = "merge-pr-doc-abc";
    const result = toReminder(id, validMergePrData);

    expect(result).not.toBeNull();
    if (result === null) return;

    expect(result.kind).toBe("merge-pr");
    expect(result.title).toBe(validMergePrData.title);
    expect(result.repo).toBe(validMergePrData.repo);
    expect(result.issueNumber).toBe(validMergePrData.issueNumber);
    if (result.kind !== "merge-pr") return;
    expect(result.prTitle).toBe(validMergePrData.prTitle);
    expect(result.prUrl).toBe(validMergePrData.prUrl);
    expect(result.prNumber).toBe(validMergePrData.prNumber);
    expect(result.prRepo).toBe(validMergePrData.prRepo);

    expect(captured).toHaveLength(0);
  });

  it("(b) missing prUrl — returns null, logs missing-required-fields with correct context", () => {
    const id = "merge-pr-doc-bad-url";
    const data = { ...validMergePrData, prUrl: undefined };
    const result = toReminder(id, data);

    expect(result).toBeNull();
    expect(captured).toHaveLength(1);
    expect((captured[0].error as Error).message).toMatch(/missing required fields/);
    expect(captured[0].context.operation).toBe("reminder-validation");
    expect(captured[0].context.itemId).toBe(id);
  });

  it("(c) empty prTitle — returns null, logs missing-required-fields with correct context", () => {
    const id = "merge-pr-doc-empty-title";
    const data = { ...validMergePrData, prTitle: "" };
    const result = toReminder(id, data);

    expect(result).toBeNull();
    expect(captured).toHaveLength(1);
    expect((captured[0].error as Error).message).toMatch(/missing required fields/);
    expect(captured[0].context.operation).toBe("reminder-validation");
    expect(captured[0].context.itemId).toBe(id);
  });

  it("(d) non-github prUrl — returns null, logs missing-required-fields with correct context", () => {
    const id = "merge-pr-doc-bad-host";
    const data = { ...validMergePrData, prUrl: "https://gitlab.com/natb1/x/pull/9" };
    const result = toReminder(id, data);

    expect(result).toBeNull();
    expect(captured).toHaveLength(1);
    expect((captured[0].error as Error).message).toMatch(/missing required fields/);
    expect(captured[0].context.operation).toBe("reminder-validation");
    expect(captured[0].context.itemId).toBe(id);
  });

  it("(e) non-positive prNumber — returns null, logs missing-required-fields with correct context", () => {
    const id = "merge-pr-doc-bad-prnum";
    const data = { ...validMergePrData, prNumber: 0 };
    const result = toReminder(id, data);

    expect(result).toBeNull();
    expect(captured).toHaveLength(1);
    expect((captured[0].error as Error).message).toMatch(/missing required fields/);
    expect(captured[0].context.operation).toBe("reminder-validation");
    expect(captured[0].context.itemId).toBe(id);
  });
});
