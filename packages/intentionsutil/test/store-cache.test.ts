import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import { validateNode } from "../src/schema.js";
import { listNodesStrictCached, storeFingerprint } from "../src/store-cache.js";
import { listNodesStrict, writeNode } from "../src/store.js";

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function seedStore(dir: string, ids: string[] = ["good-a", "good-b"]): void {
  for (const id of ids) {
    writeNode(dir, {
      id,
      kind: "tactic",
      statement: `Statement for ${id}`,
      owner: "ai",
      status: "raw",
    });
  }
}

/**
 * Truncate a node file just past its opening fence — an opening `---` with no
 * closing one, the shape a partially-written file has. Mirrors
 * `store.test.ts`'s fixture of the same name.
 */
function seedTruncatedNode(dir: string, id: string): void {
  seedStore(dir, [id]);
  const filePath = join(dir, `${id}.md`);
  const raw = readFileSync(filePath, "utf8");
  writeFileSync(filePath, raw.slice(0, raw.indexOf("\n---\n")));
}

/** The cache entries currently in `cacheDir`, sorted. */
function cacheEntries(cacheDir: string): string[] {
  return readdirSync(cacheDir)
    .filter((name) => name.startsWith("nodes-") && name.endsWith(".json"))
    .sort();
}

/**
 * Overwrite `file` with a one-node array that is valid but unlike the store —
 * so a later call returning it proves the cache was consulted rather than the
 * store re-parsed.
 */
function writeSentinel(file: string): void {
  const sentinel = validateNode({
    id: "cache-sentinel",
    kind: "tactic",
    statement: "Only reachable through the cache",
    owner: "ai",
    status: "raw",
  });
  writeFileSync(file, JSON.stringify([sentinel]));
}

function onlyEntry(cacheDir: string): string {
  const entries = cacheEntries(cacheDir);
  expect(entries).toHaveLength(1);
  return join(cacheDir, entries[0]);
}

describe("listNodesStrictCached without a cache directory", () => {
  it("returns exactly what listNodesStrict returns and writes nothing", () => {
    const dir = tempDir("intentions-");
    seedStore(dir);
    const before = readdirSync(dir).sort();

    expect(listNodesStrictCached(dir, "")).toEqual(listNodesStrict(dir));
    // With no cache directory there is nowhere to write but the store itself,
    // so an entry (or a stray temp file) would land here.
    expect(readdirSync(dir).sort()).toEqual(before);
  });
});

describe("listNodesStrictCached with a cache directory", () => {
  it("writes one entry on a cold call and returns the same nodes on a second", () => {
    const dir = tempDir("intentions-");
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);

    const cold = listNodesStrictCached(dir, cacheDir);
    expect(cold).toEqual(listNodesStrict(dir));
    expect(cacheEntries(cacheDir)).toHaveLength(1);

    expect(listNodesStrictCached(dir, cacheDir)).toEqual(cold);
    expect(cacheEntries(cacheDir)).toHaveLength(1);

    // The publish is a temp file renamed into place; nothing may survive it.
    expect(readdirSync(cacheDir).filter((name) => name.includes(".tmp."))).toEqual([]);
  });

  it("serves a hit from the entry rather than re-parsing the store", () => {
    const dir = tempDir("intentions-");
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);

    listNodesStrictCached(dir, cacheDir);
    writeSentinel(onlyEntry(cacheDir));

    expect(listNodesStrictCached(dir, cacheDir).map((n) => n.id)).toEqual(["cache-sentinel"]);
  });
});

describe("listNodesStrictCached invalidation", () => {
  /**
   * Prime the cache, plant the sentinel, then let `mutate` change the store.
   * The next call must return the real store contents — the sentinel surviving
   * would mean the fingerprint missed the change.
   */
  function expectInvalidatedBy(mutate: (dir: string) => void): void {
    const dir = tempDir("intentions-");
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);

    listNodesStrictCached(dir, cacheDir);
    writeSentinel(onlyEntry(cacheDir));

    mutate(dir);

    expect(listNodesStrictCached(dir, cacheDir)).toEqual(listNodesStrict(dir));
    expect(cacheEntries(cacheDir)).toHaveLength(2);
  }

  it("invalidates on an edited node file", () => {
    expectInvalidatedBy((dir) => {
      const filePath = join(dir, "good-a.md");
      writeFileSync(filePath, `${readFileSync(filePath, "utf8")}\nAn added body paragraph.\n`);
    });
  });

  it("invalidates on an added node file", () => {
    expectInvalidatedBy((dir) => seedStore(dir, ["good-c"]));
  });

  it("invalidates on a removed node file", () => {
    expectInvalidatedBy((dir) => rmSync(join(dir, "good-b.md")));
  });
});

describe("listNodesStrictCached degradation", () => {
  /**
   * A damaged entry costs a re-parse and nothing else: the call returns the
   * real strict enumeration and rewrites the entry in place.
   */
  function expectDegradesFrom(payload: string): void {
    const dir = tempDir("intentions-");
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);

    listNodesStrictCached(dir, cacheDir);
    const file = onlyEntry(cacheDir);
    writeFileSync(file, payload);

    expect(listNodesStrictCached(dir, cacheDir)).toEqual(listNodesStrict(dir));
    expect(JSON.parse(readFileSync(file, "utf8"))).toHaveLength(2);
  }

  it("degrades to a strict enumeration when the entry is not JSON", () => {
    expectDegradesFrom("{not json");
  });

  it("degrades to a strict enumeration when the entry fails validateNode", () => {
    expectDegradesFrom(JSON.stringify([{ id: 5 }]));
  });

  it("degrades to a strict enumeration when the entry is not an array", () => {
    expectDegradesFrom(JSON.stringify({ nodes: [] }));
  });

  it("returns the right nodes when the cache directory does not exist", () => {
    const dir = tempDir("intentions-");
    const cacheDir = join(tempDir("intentions-cache-"), "never-created");
    seedStore(dir);

    expect(listNodesStrictCached(dir, cacheDir)).toEqual(listNodesStrict(dir));
  });

  it("returns the right nodes when the cache directory is a regular file", () => {
    const dir = tempDir("intentions-");
    const cacheFile = join(tempDir("intentions-cache-"), "not-a-directory");
    writeFileSync(cacheFile, "");
    seedStore(dir);

    // Both the entry read and the publish fail with ENOTDIR here, so this
    // exercises the temp-file cleanup path as well as the swallowed write.
    expect(listNodesStrictCached(dir, cacheFile)).toEqual(listNodesStrict(dir));
    expect(readFileSync(cacheFile, "utf8")).toBe("");
  });
});

describe("listNodesStrictCached stays fail-closed", () => {
  it("throws on a corrupt store with and without a cache directory", () => {
    const dir = tempDir("intentions-");
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);
    seedTruncatedNode(dir, "truncated");

    expect(() => listNodesStrictCached(dir, "")).toThrow(IntentionSchemaError);
    expect(() => listNodesStrictCached(dir, cacheDir)).toThrow(IntentionSchemaError);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it("throws on a missing store directory even with a cache directory", () => {
    const cacheDir = tempDir("intentions-cache-");
    const missing = join(tempDir("intentions-"), "never-created");

    // The fingerprint cannot be taken, so no key exists — the call must fall
    // through to `listNodesStrict` and surface ITS failure, not read as an
    // empty store.
    expect(() => listNodesStrictCached(missing, cacheDir)).toThrow();
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it("does not serve a stale entry once the store goes corrupt", () => {
    const dir = tempDir("intentions-");
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);

    listNodesStrictCached(dir, cacheDir);
    seedTruncatedNode(dir, "truncated");

    expect(() => listNodesStrictCached(dir, cacheDir)).toThrow(IntentionSchemaError);
    expect(cacheEntries(cacheDir)).toHaveLength(1);
  });
});

describe("listNodesStrictCached compare-and-swaps the publish", () => {
  afterEach(() => {
    vi.doUnmock("../src/store.js");
    vi.resetModules();
  });

  /**
   * The key's fingerprint is necessarily taken BEFORE the parse it names, so a
   * writer landing in that window would otherwise file post-write nodes under a
   * pre-write key — an entry describing a state its own key does not, which a
   * later call at the pre-write state would then serve. Standing in for that
   * writer: a `listNodesStrict` that mutates the store as it returns, which is
   * exactly the interleaving without the flakiness of a real race.
   *
   * Without the re-fingerprint in `writeCacheEntry` this test fails on the
   * entry count alone — verified by deleting that line, which leaves every
   * other case in this file green.
   */
  it("writes no entry when a writer lands between the key and the parse", async () => {
    const dir = tempDir("intentions-");
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);

    vi.resetModules();
    vi.doMock("../src/store.js", async () => {
      const actual = await vi.importActual<typeof import("../src/store.js")>("../src/store.js");
      return {
        ...actual,
        listNodesStrict(target: string) {
          const nodes = actual.listNodesStrict(target);
          seedStore(target, ["landed-mid-parse"]);
          return nodes;
        },
      };
    });
    const { listNodesStrictCached: cached } = await import("../src/store-cache.js");

    // The answer is still the parse's own result — the CAS costs the entry,
    // never the correctness of the call that paid for it.
    expect(cached(dir, cacheDir).map((n) => n.id)).toEqual(["good-a", "good-b"]);
    expect(cacheEntries(cacheDir)).toEqual([]);
    expect(readdirSync(cacheDir)).toEqual([]);
  });
});

describe("listNodesStrictCached with the cache pointed at the store", () => {
  it("degrades to an uncached strict enumeration instead of littering the store", () => {
    const dir = tempDir("intentions-");
    seedStore(dir);
    const before = readdirSync(dir).sort();

    expect(listNodesStrictCached(dir, dir)).toEqual(listNodesStrict(dir));
    // An entry written here would change the very fingerprint it was filed
    // under, so every later call would miss and drop another one.
    expect(readdirSync(dir).sort()).toEqual(before);
  });
});

describe("storeFingerprint", () => {
  it("is stable across repeated calls on an unchanged store", () => {
    const dir = tempDir("intentions-");
    seedStore(dir);

    expect(storeFingerprint(dir)).toBe(storeFingerprint(dir));
  });

  it("changes on an add, a remove, and an edit", () => {
    const dir = tempDir("intentions-");
    seedStore(dir);
    const base = storeFingerprint(dir);

    seedStore(dir, ["good-c"]);
    const afterAdd = storeFingerprint(dir);
    expect(afterAdd).not.toBe(base);

    rmSync(join(dir, "good-c.md"));
    expect(storeFingerprint(dir)).toBe(base);

    const filePath = join(dir, "good-a.md");
    writeFileSync(filePath, `${readFileSync(filePath, "utf8")}\nAn added body paragraph.\n`);
    expect(storeFingerprint(dir)).not.toBe(base);
  });

  it("covers files the node enumeration ignores", () => {
    const dir = tempDir("intentions-");
    seedStore(dir);
    const base = storeFingerprint(dir);

    writeFileSync(join(dir, "README.md"), "companion doc\n");
    expect(storeFingerprint(dir)).not.toBe(base);

    writeFileSync(join(dir, "notes.txt"), "not a node file\n");
    expect(storeFingerprint(dir)).not.toBe(base);
  });

  it("covers a symlinked node file by what it resolves to", () => {
    const dir = tempDir("intentions-");
    const elsewhere = tempDir("intentions-target-");
    const target = join(elsewhere, "linked.md");
    seedStore(dir);
    seedStore(elsewhere, ["linked"]);
    symlinkSync(target, join(dir, "linked.md"));

    // The enumeration reads through the link, so the fingerprint must too.
    expect(listNodesStrict(dir).map((n) => n.id)).toContain("linked");
    const base = storeFingerprint(dir);

    writeFileSync(target, `${readFileSync(target, "utf8")}\nAn added body paragraph.\n`);
    expect(storeFingerprint(dir)).not.toBe(base);
  });

  it("propagates a read failure rather than fingerprinting an absent store", () => {
    expect(() => storeFingerprint(join(tempDir("intentions-"), "missing"))).toThrow();
  });
});

describe("storeFingerprint on a filesystem that reports no d_type", () => {
  afterEach(() => {
    vi.doUnmock("node:fs");
    vi.resetModules();
  });

  /**
   * `readdirSync(withFileTypes)` yields `UV_DIRENT_UNKNOWN` on filesystems that
   * do not populate `d_type` (XFS without `ftype=1`, several FUSE and network
   * mounts), and Node performs no `lstat` fallback — `isFile`, `isDirectory`
   * and `isSymbolicLink` are then ALL false. `listNodesResilient` reads such an
   * entry as a node anyway (it `readFileSync`s every `*.md` without inspecting
   * the type), so a fingerprint that classified from the dirent alone would
   * reduce to a hash of the sorted file NAMES there and serve every in-place
   * node edit from a stale entry. This stands in for that filesystem.
   */
  it("still covers file content when every dirent reports UNKNOWN", async () => {
    const dir = tempDir("intentions-");
    seedStore(dir);

    vi.resetModules();
    vi.doMock("node:fs", async () => {
      const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
      return {
        ...actual,
        default: actual,
        readdirSync(target: string, options?: { withFileTypes?: boolean }) {
          const entries = actual.readdirSync(target, { withFileTypes: true });
          if (options?.withFileTypes !== true) return entries.map((entry) => entry.name);
          return entries.map((entry) => ({
            name: entry.name,
            isFile: () => false,
            isDirectory: () => false,
            isSymbolicLink: () => false,
          }));
        },
      };
    });
    const { storeFingerprint: fingerprint } = await import("../src/store-cache.js");

    const base = fingerprint(dir);
    const filePath = join(dir, "good-a.md");
    writeFileSync(filePath, `${readFileSync(filePath, "utf8")}\nAn added body paragraph.\n`);

    expect(fingerprint(dir)).not.toBe(base);
  });
});
