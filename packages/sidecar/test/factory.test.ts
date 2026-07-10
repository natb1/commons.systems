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
// Minimal in-memory FSA directory-handle fake backed by a shared "disk" cell,
// so two handles pointed at the same cell model two tabs on one folder.
// ---------------------------------------------------------------------------

interface DiskCell {
  content: string | null;
}

function makeDir(
  disk: DiskCell,
  opts: { failWrite?: boolean } = {},
): { dir: FileSystemDirectoryHandle; writeCount: () => number } {
  let writes = 0;
  const fileHandle = {
    getFile: () =>
      disk.content === null
        ? Promise.reject(new DOMException("missing", "NotFoundError"))
        : Promise.resolve({ text: () => Promise.resolve(disk.content as string) }), // type-safety-ok: fake FSA file content is a string in test
    createWritable: () => {
      writes++;
      let buf = "";
      return Promise.resolve({
        write: (s: string) => {
          if (opts.failWrite) return Promise.reject(new Error("disk full"));
          buf += s;
          return Promise.resolve();
        },
        close: () => {
          disk.content = buf;
          return Promise.resolve();
        },
        abort: () => Promise.resolve(),
      });
    },
  };
  const subdir = {
    getFileHandle: (_name: string, _opts?: { create?: boolean }) =>
      Promise.resolve(fileHandle),
  };
  const dir = {
    name: "folder",
    getDirectoryHandle: (_name: string, _opts?: { create?: boolean }) =>
      Promise.resolve(subdir),
  } as unknown as FileSystemDirectoryHandle; // type-safety-ok: in-memory FSA directory-handle fake for test
  return { dir, writeCount: () => writes };
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

  // --- Unit 1: cross-tab write coordination (read-merge-write against disk) ---

  // Two tabs on one folder: the second tab's write must preserve the first
  // tab's already-persisted entry instead of clobbering it against a stale
  // in-memory model.
  it("two tabs on one folder preserve both tabs' entries (cross-tab no-clobber)", async () => {
    const disk: DiskCell = { content: null };
    const { dir } = makeDir(disk);

    const tabA = makeHandle();
    const tabB = makeHandle();
    tabA.setLocalDirectory(dir, true);
    tabB.setLocalDirectory(dir, true);

    // Tab A persists {a:1}. Tab B — whose in-memory model never saw {a:1} —
    // then persists {b:2}.
    await tabA.enqueueWrite({ values: { a: 1 } });
    await tabA.flushWrites();
    await tabB.enqueueWrite({ values: { b: 2 } });
    await tabB.flushWrites();

    // On disk both survive: tab B read-merge-wrote against tab A's persisted
    // state rather than its own stale (empty) model.
    const onDisk = tabB.parseSidecar(disk.content as string);
    expect(onDisk?.values).toEqual({ a: 1, b: 2 });
  });

  // A single tab's own successive writes still round-trip through disk.
  it("read-merge-write persists across a tab's own successive writes", async () => {
    const disk: DiskCell = { content: null };
    const { dir } = makeDir(disk);
    const s = makeHandle();
    s.setLocalDirectory(dir, true);

    await s.enqueueWrite({ values: { a: 1 } });
    await s.enqueueWrite({ values: { b: 2 } });
    await s.flushWrites();

    const onDisk = s.parseSidecar(disk.content as string);
    expect(onDisk?.values).toEqual({ a: 1, b: 2 });
  });

  // --- Unit 2: surface persist failures ---

  // A failed disk write rejects the caller's promise instead of resolving.
  it("enqueueWrite rejects the caller's promise when the disk write fails", async () => {
    const disk: DiskCell = { content: null };
    const { dir } = makeDir(disk, { failWrite: true });
    const s = makeHandle();
    s.setLocalDirectory(dir, true);

    await expect(s.enqueueWrite({ values: { a: 1 } })).rejects.toThrow();
  });

  // flushWrites reflects a pending write failure rather than resolving clean.
  it("flushWrites rejects when the most recent queued write failed", async () => {
    const disk: DiskCell = { content: null };
    const { dir } = makeDir(disk, { failWrite: true });
    const s = makeHandle();
    s.setLocalDirectory(dir, true);

    // Swallow the caller-facing rejection; assert the drain reflects it.
    s.enqueueWrite({ values: { a: 1 } }).catch(() => undefined);
    await expect(s.flushWrites()).rejects.toThrow();
  });

  // One failed write does not poison the chain: a later write still runs, and a
  // subsequent success clears the failure the drain reports.
  it("a failed write does not poison the chain; a later success recovers", async () => {
    const disk: DiskCell = { content: null };
    const opts = { failWrite: true };
    const { dir } = makeDir(disk, opts);
    const s = makeHandle();
    s.setLocalDirectory(dir, true);

    await expect(s.enqueueWrite({ values: { a: 1 } })).rejects.toThrow();

    // Disk recovers; the next write succeeds and the drain is clean again.
    opts.failWrite = false;
    await s.enqueueWrite({ values: { b: 2 } });
    await expect(s.flushWrites()).resolves.toBeUndefined();

    const onDisk = s.parseSidecar(disk.content as string);
    expect(onDisk?.values).toEqual({ b: 2 });
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
