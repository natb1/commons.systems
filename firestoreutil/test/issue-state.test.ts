import { describe, it, expect, vi } from "vitest";
import {
  readIssueState,
  writeIssueState,
  validateIssueNumber,
  type IssueNumber,
} from "../src/issue-state.js";

function createMockFirestore() {
  const store = new Map<string, Record<string, unknown>>();

  const mockDoc = vi.fn((path: string) => ({
    get: vi.fn(async () => {
      const data = store.get(path);
      return {
        exists: data !== undefined,
        data: () => data,
      };
    }),
    set: vi.fn(async (data: Record<string, unknown>) => {
      store.set(path, data);
    }),
  }));

  const db = { doc: mockDoc } as unknown as import("firebase-admin/firestore").Firestore;

  return { db, mockDoc, store };
}

describe("validateIssueNumber", () => {
  it("accepts positive integers", () => {
    expect(validateIssueNumber(1)).toBe(1);
    expect(validateIssueNumber(42)).toBe(42);
    expect(validateIssueNumber(354)).toBe(354);
  });

  it("rejects zero", () => {
    expect(() => validateIssueNumber(0)).toThrow("positive integer");
  });

  it("rejects negative numbers", () => {
    expect(() => validateIssueNumber(-1)).toThrow("positive integer");
  });

  it("rejects NaN", () => {
    expect(() => validateIssueNumber(NaN)).toThrow("positive integer");
  });

  it("rejects non-integer", () => {
    expect(() => validateIssueNumber(1.5)).toThrow("positive integer");
  });
});

describe("readIssueState", () => {
  const issue42 = 42 as IssueNumber;
  const issue354 = 354 as IssueNumber;

  it("returns null for missing document", async () => {
    const { db } = createMockFirestore();

    const result = await readIssueState(db, issue42);

    expect(result).toBeNull();
  });

  it("returns data for existing document", async () => {
    const { db, store } = createMockFirestore();
    store.set("claude-workflow/42", { version: 1, step: 3, phase: "core" });

    const result = await readIssueState(db, issue42);

    expect(result).toEqual({ version: 1, step: 3, phase: "core" });
  });

  it("uses correct document path", async () => {
    const { db, mockDoc } = createMockFirestore();

    await readIssueState(db, issue354);

    expect(mockDoc).toHaveBeenCalledWith("claude-workflow/354");
  });
});

describe("writeIssueState", () => {
  const issue42 = 42 as IssueNumber;
  const issue99 = 99 as IssueNumber;

  it("persists the state object", async () => {
    const { db, store } = createMockFirestore();
    const state = { version: 1, step: 6, phase: "verify" };

    await writeIssueState(db, issue42, state);

    expect(store.get("claude-workflow/42")).toEqual(state);
  });

  it("uses correct document path", async () => {
    const { db, mockDoc } = createMockFirestore();

    await writeIssueState(db, issue99, { version: 1 });

    expect(mockDoc).toHaveBeenCalledWith("claude-workflow/99");
  });

  it("overwrites previous state", async () => {
    const { db } = createMockFirestore();

    await writeIssueState(db, issue42, { version: 1, step: 3 });
    await writeIssueState(db, issue42, { version: 1, step: 6 });

    const result = await readIssueState(db, issue42);
    expect(result).toEqual({ version: 1, step: 6 });
  });
});

describe("round-trip", () => {
  it("write then read returns the same state", async () => {
    const { db } = createMockFirestore();
    const state = {
      version: 1,
      step: 7,
      step_label: "Smoke Test Loop",
      phase: "verify",
      active_skills: ["ref-memory-management", "ref-pr-workflow"],
    };

    await writeIssueState(db, 42 as IssueNumber, state);
    const result = await readIssueState(db, 42 as IssueNumber);

    expect(result).toEqual(state);
  });
});
