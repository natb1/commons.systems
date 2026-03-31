import { describe, it, expect, vi } from "vitest";
import { readIssueState, writeIssueState } from "../src/issue-state.js";

function createMockFirestore() {
  const store = new Map<string, Record<string, unknown>>();

  const mockSet = vi.fn(async (data: Record<string, unknown>) => {
    const path = mockDoc.mock.lastCall![0] as string;
    store.set(path, data);
  });

  const mockGet = vi.fn(async () => {
    const path = mockDoc.mock.lastCall![0] as string;
    const data = store.get(path);
    return {
      exists: data !== undefined,
      data: () => data,
    };
  });

  const mockDoc = vi.fn((_path: string) => ({
    get: mockGet,
    set: mockSet,
  }));

  const db = { doc: mockDoc } as unknown as import("firebase-admin/firestore").Firestore;

  return { db, mockDoc, mockGet, mockSet, store };
}

describe("readIssueState", () => {
  it("returns null for missing document", async () => {
    const { db } = createMockFirestore();

    const result = await readIssueState(db, 42);

    expect(result).toBeNull();
  });

  it("returns data for existing document", async () => {
    const { db, store } = createMockFirestore();
    store.set("claude-workflow/42", { version: 1, step: 3, phase: "core" });

    const result = await readIssueState(db, 42);

    expect(result).toEqual({ version: 1, step: 3, phase: "core" });
  });

  it("uses correct document path", async () => {
    const { db, mockDoc } = createMockFirestore();

    await readIssueState(db, 354);

    expect(mockDoc).toHaveBeenCalledWith("claude-workflow/354");
  });
});

describe("writeIssueState", () => {
  it("calls set with the state object", async () => {
    const { db, mockSet } = createMockFirestore();
    const state = { version: 1, step: 6, phase: "verify" };

    await writeIssueState(db, 42, state);

    expect(mockSet).toHaveBeenCalledWith(state);
  });

  it("uses correct document path", async () => {
    const { db, mockDoc } = createMockFirestore();

    await writeIssueState(db, 99, { version: 1 });

    expect(mockDoc).toHaveBeenCalledWith("claude-workflow/99");
  });

  it("overwrites previous state", async () => {
    const { db } = createMockFirestore();

    await writeIssueState(db, 42, { version: 1, step: 3 });
    await writeIssueState(db, 42, { version: 1, step: 6 });

    const result = await readIssueState(db, 42);
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

    await writeIssueState(db, 42, state);
    const result = await readIssueState(db, 42);

    expect(result).toEqual(state);
  });
});
