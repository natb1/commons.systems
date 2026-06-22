import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock errorutil/log so logError calls don't throw or produce noise
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
}));

import { createSidecar, serializeSidecar, isPlainObject } from "../src/index.ts";

// ---------------------------------------------------------------------------
// Minimal test schema
// ---------------------------------------------------------------------------

interface TestData {
  version: 1;
  values: Record<string, number>;
}
type TestPatch = { values?: Record<string, number> };

function makeHandle() {
  return createSidecar<TestData, TestPatch>({
    sidecarDirName: ".commons-test",
    sidecarFileName: "index.json",
    emptyModel: () => ({ version: 1, values: {} }),
    coerce: (parsed) => ({
      version: 1,
      values:
        isPlainObject(parsed.values)
          ? Object.fromEntries(
              Object.entries(parsed.values).filter(
                ([, v]) => typeof v === "number",
              ) as [string, number][],
            )
          : {},
    }),
    mergeSidecar: (existing, patch) => ({
      ...existing,
      values: { ...existing.values, ...(patch.values ?? {}) },
    }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createSidecar factory", () => {
  let sidecar: ReturnType<typeof makeHandle>;

  beforeEach(() => {
    sidecar = makeHandle();
  });

  // 1. parseSidecar tolerates malformed JSON
  it("parseSidecar returns null for malformed JSON", () => {
    const result = sidecar.parseSidecar("not json{");
    expect(result).toBeNull();
  });

  // 2. parseSidecar of a non-object root
  it("parseSidecar returns null for non-object root", () => {
    expect(sidecar.parseSidecar("[1,2,3]")).toBeNull();
    expect(sidecar.parseSidecar("42")).toBeNull();
  });

  // 3. parseSidecar of a valid object → coerced model
  it("parseSidecar coerces a valid object", () => {
    const result = sidecar.parseSidecar(JSON.stringify({ values: { a: 1 } }));
    expect(result).toEqual({ version: 1, values: { a: 1 } });
  });

  // 4. serializeSidecar round-trips
  it("serializeSidecar round-trips through parseSidecar", () => {
    const model: TestData = { version: 1, values: { x: 10, y: 20 } };
    const text = serializeSidecar(model);
    expect(sidecar.parseSidecar(text)).toEqual(model);
  });

  // 5. enqueueWrite + flushWrites updates in-memory model (no directory bound)
  it("enqueueWrite merges in-memory even with no directory bound", async () => {
    await sidecar.enqueueWrite({ values: { a: 1 } });
    await sidecar.flushWrites();
    const loaded = await sidecar.ensureLoaded();
    expect(loaded.values).toEqual({ a: 1 });
  });

  // 6. Second enqueueWrite merges over the first (no-clobber)
  it("second enqueueWrite merges over the first without clobbering", async () => {
    await sidecar.enqueueWrite({ values: { a: 1 } });
    await sidecar.enqueueWrite({ values: { b: 2 } });
    await sidecar.flushWrites();
    const loaded = await sidecar.ensureLoaded();
    expect(loaded.values).toEqual({ a: 1, b: 2 });
  });

  // 7. setLocalDirectory then clearLocalDirectory resets to emptyModel
  it("clearLocalDirectory resets state so ensureLoaded returns emptyModel", async () => {
    const fakeHandle = {} as unknown as FileSystemDirectoryHandle; // type-safety-ok: test-only stub, no FSA methods are called in this test
    sidecar.setLocalDirectory(fakeHandle, false);
    await sidecar.enqueueWrite({ values: { a: 99 } });
    await sidecar.flushWrites();

    sidecar.clearLocalDirectory();
    const loaded = await sidecar.ensureLoaded();
    expect(loaded).toEqual({ version: 1, values: {} });
  });

  // 8. isPlainObject
  describe("isPlainObject", () => {
    it("returns true for plain objects", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });

    it("returns false for arrays, null, and primitives", () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(42)).toBe(false);
    });
  });
});
