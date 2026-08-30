import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
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
    const cacheDir = tempDir("intentions-cache-");
    seedStore(dir);

    expect(listNodesStrictCached(dir, "")).toEqual(listNodesStrict(dir));
    expect(readdirSync(cacheDir)).toEqual([]);
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

  it("propagates a read failure rather than fingerprinting an absent store", () => {
    expect(() => storeFingerprint(join(tempDir("intentions-"), "missing"))).toThrow();
  });
});
