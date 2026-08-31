import { createHash } from "node:crypto";
import { readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateNode, type IntentionNode } from "./schema.js";
import { listNodesStrict } from "./store.js";

/**
 * Content-addressed materialization of `listNodesStrict`, so several processes
 * in one dispatch tick can share a single parse of `intentions/`.
 *
 * WHY CONTENT ADDRESSING. The tick's merge-and-reconcile band runs five strict
 * enumerations of the same directory (`graph-auto-merge`,
 * `reconcile-graph-merged`'s pre-scan, `reconcile-graph.ts`'s two inner scans,
 * and `reconcile-graph-review-stall`), and those sweeps WRITE node files
 * between their own reads — through `graph-commit`, `apply-node-transition`
 * and `apply-fix-state`. A "materialize once, pass a file path" share would
 * therefore hand a later consumer a stale node set. Keying the cache on a hash
 * of the store's bytes turns that hazard into an automatic miss: the entry is a
 * pure function of the store state, so a state the store has left cannot be
 * served under a key naming the state it is in.
 *
 * The residual window is ABA, and it is worth naming because a reader will look
 * for it. The fingerprint and the parse are separate passes over the directory,
 * so a writer that changes a node file and then restores its exact prior bytes
 * during the parse — `graph-commit`'s bounded rebase-retry resetting the tree is
 * the shape to picture — can leave the parse holding a torn mix while both
 * fingerprints still read as the pre-write state, and the mix is then published.
 * The uncached path tears identically under that interleaving; what caching adds
 * is that the torn read persists for later calls instead of dying with the
 * process. Closing it needs a snapshot or a lock over the whole read, which is a
 * larger contract than this layer has; the CAS below narrows the window to the
 * change-and-revert case rather than eliminating it.
 *
 * That is a property of the WRITE path as much as of the key. The fingerprint
 * is necessarily taken before the parse it names, so a writer landing in that
 * window would otherwise file post-write nodes under a pre-write key — an entry
 * describing a state its own key does not, which a later call at the pre-write
 * state would then serve. `writeCacheEntry` closes that window by re-taking the
 * fingerprint after the parse and publishing only when it is unchanged
 * (compare-and-swap on the store bytes); an interleaved write costs the entry,
 * never its correctness.
 *
 * That is the difference from `DISPATCH_CI_VERDICT_CACHE`
 * (`.claude/skills/dispatch-propagate/scripts/lib.sh`, the
 * `dispatch_ci_verdict_rest` header): that cache memoizes a network verdict
 * with no TTL and no invalidation, so an inherited directory pins a poll loop
 * forever, which is why `dispatch-ladder-run` must `unset` the variable before
 * every reconciler call. This cache keys on the very bytes it summarizes, so it
 * needs no such discipline.
 *
 * WHAT IS PRESERVED. Strictness is load-bearing at every consumer: a corrupt
 * node file dropped by the tolerant reader silently satisfies
 * `blockersComplete` (`router.ts`) or strands a merged PR at a stale phase. So
 * a corrupt store still throws `IntentionSchemaError` out of this helper, cached
 * or not, and nothing is written on that path. A corrupt or unreadable CACHE
 * entry degrades to a fresh STRICT enumeration — never to the tolerant
 * `listNodes`, never to an empty set. An entry always holds the complete store,
 * never a filtered subset, because both `graph-auto-merge` and the review-stall
 * sweep build a `byId` map and an id absent from it reads as `COMPLETE`.
 *
 * The caller owns the cache directory's lifecycle: this module never creates it
 * and never prunes it, mirroring `dispatch_ci_verdict_rest`.
 *
 * MEASURED COST (2026-08-19, 717 files in `intentions/`, 716 parsed nodes):
 * in-process store parse alone 376 ms; `JSON.stringify` of the node array 45 ms
 * for 2.91 MB; `JSON.parse` plus `validateNode` over all 716 nodes 3-6 ms; a
 * content hash of every file in the directory 10-18 ms. So a hit costs ~20 ms
 * against a ~500 ms miss. If those numbers move far enough that the hash
 * approaches the parse, the trade no longer holds and this layer should go.
 */

/**
 * sha256 over every entry in `dir`, sorted by name — each entry's name, a
 * file/directory marker, and, for files, the file's bytes.
 *
 * Hashes EVERY entry, not just `*.md`. That is a superset of what
 * `listNodesResilient` reads (it filters to `*.md` minus `README.md`), so the
 * key cannot miss a change the enumeration would see; the cost is a spurious
 * miss when an unrelated companion file changes, which is the safe direction.
 *
 * A symlink is hashed by what it RESOLVES to, for the same superset reason:
 * `listNodesResilient` calls `readFileSync` on `<id>.md` without inspecting the
 * entry type, so a symlinked node file IS a node to the enumeration. Hashing
 * only the link's own directory entry would let an edit made through it land
 * without moving the key — a stale hit, the one failure this module exists to
 * make impossible.
 *
 * Each field is framed with a NUL separator and file bytes carry an explicit
 * byte count, so no rename or content shuffle can produce a colliding stream.
 * Read errors PROPAGATE: an unreadable store directory must abort the caller
 * rather than fingerprint as empty, which would be a cache key that outlives
 * the failure. `listNodesStrictCached` catches that throw and re-raises it
 * through `listNodesStrict` instead — see `fingerprintOrNull`, which is what
 * keeps a companion file this function reads but the ENUMERATION does not from
 * being able to abort a sweep the uncached path would have completed.
 */
export function storeFingerprint(dir: string): string {
  const entries = readdirSync(dir, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const hash = createHash("sha256");
  for (const entry of entries) {
    const path = join(dir, entry.name);
    const isFile = entry.isFile() || (entry.isSymbolicLink() && statSync(path).isFile());
    const marker = isFile ? "f" : entry.isDirectory() ? "d" : "o";
    hash.update(`${entry.name}\0${marker}\0`);
    if (isFile) {
      const bytes = readFileSync(path);
      hash.update(`${bytes.length}\0`);
      hash.update(bytes);
    }
  }
  return hash.digest("hex");
}

/**
 * Read a cache entry back into nodes, or return null when it cannot be trusted.
 *
 * Every failure mode — missing file, unreadable file, malformed JSON, a
 * non-array payload, an element `validateNode` rejects — is one answer: null,
 * meaning "no usable entry". The caller then re-enumerates strictly. This
 * function never throws and never returns a partial set, so a damaged entry
 * costs one parse and nothing else.
 */
function readCacheEntry(file: string): IntentionNode[] | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(parsed)) return null;
    const items: unknown[] = parsed;
    return items.map((item) => validateNode(item));
  } catch {
    return null;
  }
}

/**
 * The store fingerprint, or null when this call could not take one.
 *
 * A fingerprint reads strictly MORE of the directory than the enumeration does
 * (every entry, not just `*.md`), so its read set includes files whose failure
 * says nothing about whether the store can be enumerated: a companion file with
 * no read permission, or — the live case, since the whole point of this module
 * is sweeps interleaved with writers — a `writeNode` temp file
 * (`.<id>.md.<pid>.<rand>.tmp`, `store.ts`'s `writeFileAtomic`) that readdir
 * listed and rename retired before the read reached it. Letting either abort
 * the caller would make the cached path FAIL where the uncached path succeeds,
 * which no read-only optimization may do.
 *
 * Null therefore means "no key available", not "the store is fine": the caller
 * falls through to `listNodesStrict`, whose own `readdirSync` re-raises a
 * genuinely unreadable store directory. The clear-error posture is preserved,
 * one layer down.
 */
function fingerprintOrNull(dir: string): string | null {
  try {
    return storeFingerprint(dir);
  } catch {
    return null;
  }
}

/**
 * Publish `nodes` at `file`, best-effort, but only while the store still reads
 * as `fingerprint`.
 *
 * The re-fingerprint is a compare-and-swap on the store bytes: `fingerprint`
 * was taken before the parse, so a writer that landed in between would have
 * this call publish a post-write node set under a pre-write key. Skipping the
 * write there is what makes an entry a pure function of the state its key
 * names. It costs one extra hash (10-18 ms) on the miss path only, against the
 * ~500 ms parse that path just paid.
 *
 * A temp file renamed onto the final name keeps the entry atomic — a concurrent
 * writer either wins or loses with identical content, never a torn file — and
 * the temp is removed when the publish fails, so a full or read-only cache
 * directory cannot leave litter behind. Every failure is swallowed: whether the
 * write lands changes only the cost of the next call, never its answer.
 *
 * The temp name carries a random suffix as well as the pid, matching
 * `store.ts`'s `writeFileAtomic`. The pid alone is NOT unique here: the whole
 * point of this cache is several processes sharing one directory, and under the
 * sandbox's PID namespace those processes draw from the same tiny pid range —
 * measured 2026-08-30, three separate sandboxed `node` invocations reported pids
 * 4, 5 and 4. Two of them colliding on one temp path would let one process
 * rename the file the other is still writing, publishing a truncated entry that
 * every later call at this fingerprint then has to reject and re-parse.
 */
function writeCacheEntry(
  file: string,
  dir: string,
  fingerprint: string,
  nodes: IntentionNode[],
): void {
  const tmp = `${file}.tmp.${process.pid}.${Math.random().toString(36).slice(2)}`;
  try {
    if (fingerprintOrNull(dir) !== fingerprint) return;
    writeFileSync(tmp, JSON.stringify(nodes));
    renameSync(tmp, file);
  } catch {
    // The caller owns the directory; a missing or unwritable one costs a
    // repeated parse, not a failed sweep.
    try {
      rmSync(tmp, { force: true });
    } catch {
      // best-effort cleanup of a temp file that may never have been created
    }
  }
}

/**
 * `listNodesStrict`, memoized on the store's content when `cacheDir` names a
 * directory the caller has created.
 *
 * With an empty `cacheDir` this IS `listNodesStrict` — byte-for-byte the same
 * behavior, no file touched. That degradation is what keeps `/dispatch-ladder`'s
 * single-node `--node` path working unchanged: it runs each reconciler as a
 * separate process with no tick around it, so it supplies no cache directory.
 *
 * The key pairs the resolved directory path with the store fingerprint, so two
 * stores with coincidentally identical contents never share an entry. When no
 * key can be taken at all the call is simply uncached (`fingerprintOrNull`),
 * never failed.
 *
 * A `cacheDir` that IS the store degrades the same way. The fingerprint hashes
 * every entry in the directory, so an entry written into the store would change
 * the very key it was filed under: each call would miss, re-parse, and drop
 * another `nodes-*.json` into the versioned `intentions/` tree forever. That is
 * a caller misconfiguration (a mis-set `DISPATCH_GRAPH_NODE_CACHE`), and this
 * layer may not fail a sweep the uncached path would have completed, so it is
 * answered by simply not caching.
 *
 * Writing the entry is best-effort and compare-and-swapped on the store bytes;
 * see `writeCacheEntry`. Whether the write lands changes only the cost of the
 * next call, never its answer.
 */
export function listNodesStrictCached(dir: string, cacheDir: string): IntentionNode[] {
  if (!cacheDir || resolve(cacheDir) === resolve(dir)) return listNodesStrict(dir);

  const fingerprint = fingerprintOrNull(dir);
  if (fingerprint === null) return listNodesStrict(dir);

  const dirKey = createHash("sha256").update(resolve(dir)).digest("hex").slice(0, 12);
  const file = join(cacheDir, `nodes-${dirKey}-${fingerprint.slice(0, 32)}.json`);

  const cached = readCacheEntry(file);
  if (cached !== null) return cached;

  // A corrupt store throws here — the fail-closed path — and nothing below
  // runs, so no entry is written for a store that cannot be enumerated.
  const nodes = listNodesStrict(dir);

  writeCacheEntry(file, dir, fingerprint, nodes);

  return nodes;
}
