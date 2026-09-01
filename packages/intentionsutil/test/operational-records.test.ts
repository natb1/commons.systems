import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import {
  canonicalJson,
  claimPath,
  conflictingClaims,
  contentHash12,
  evidencePath,
  isClaimLive,
  utcInstant,
  validateClaimRecord,
  validateEvidenceEntry,
} from "../src/operational-records.js";
import {
  appendEvidence,
  listClaims,
  listEvidence,
  mintClaim,
  readClaim,
  readEvidence,
} from "../src/operational-store.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "operational-"));
}

/**
 * Fixtures are plain objects, not typed records: the validators take `unknown`
 * by contract, and the negative cases below feed them shapes the types forbid.
 * Typing the fixtures would force an `as` cast at every one of those call sites.
 */
function evidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: "evidence.v1",
    strategy: "strategy-graph-native-dispatch",
    criterion: "criterion-3",
    gap: null,
    finding: "The ladder skipped main-qa for a node with residue.",
    disposition: "fixed",
    proof: { sha: "0123456789abcdef0123", pr: null, stamp: null, check: null },
    recurrence_key: "mainqa-skip",
    claim: null,
    observed_at: "2026-09-01",
    ...overrides,
  };
}

function claim(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: "claim.v1",
    claim_id: "claim-alpha",
    strategy: "strategy-graph-native-dispatch",
    bite: ["criterion-3", "criterion-4"],
    claimed_at: "2026-09-01T10:00:00Z",
    expires_at: "2026-09-01T12:00:00Z",
    holder: { session: "sess-1", worktree: "wt-1", branch: "tactic-x" },
    pr: null,
    ...overrides,
  };
}

/** Every file under `root`, as `relative path -> content`, for whole-tree comparison. */
function treeSnapshot(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else out[relative(root, full).split(sep).join("/")] = readFileSync(full, "utf8");
    }
  };
  walk(root);
  return out;
}

describe("validateEvidenceEntry", () => {
  it("accepts a criterion-bearing entry and normalizes unset proof members to null", () => {
    const validated = validateEvidenceEntry(
      evidence({ proof: { pr: 3140 }, disposition: null }),
    );
    expect(validated.proof).toEqual({ sha: null, pr: 3140, stamp: null, check: null });
    expect(validated.disposition).toBeNull();
  });

  it("accepts a gap-bearing entry with a null criterion", () => {
    const validated = validateEvidenceEntry(
      evidence({ criterion: null, gap: "No sensor covers this." }),
    );
    expect(validated.criterion).toBeNull();
    expect(validated.gap).toBe("No sensor covers this.");
  });

  it("rejects an entry with both criterion and gap", () => {
    expect(() => validateEvidenceEntry(evidence({ gap: "also a gap" }))).toThrow(
      /Exactly one of evidence.criterion \/ evidence.gap/,
    );
  });

  it("rejects an entry with neither criterion nor gap", () => {
    expect(() => validateEvidenceEntry(evidence({ criterion: null, gap: null }))).toThrow(
      IntentionSchemaError,
    );
  });

  it("refuses an entry whose proof members are all null", () => {
    expect(() =>
      validateEvidenceEntry(evidence({ proof: { sha: null, pr: null, stamp: null, check: null } })),
    ).toThrow(/carries no proof/);
  });

  it("refuses an entry with no proof key at all", () => {
    expect(() => validateEvidenceEntry(evidence({ proof: {} }))).toThrow(/carries no proof/);
  });

  it("rejects an unknown top-level key, naming it", () => {
    expect(() => validateEvidenceEntry(evidence({ pr_body: "expected diff text" }))).toThrow(
      /Unknown key evidence.pr_body/,
    );
  });

  it("rejects an unknown proof key, so PR content cannot be smuggled in", () => {
    expect(() =>
      validateEvidenceEntry(evidence({ proof: { sha: "0123456", pr_title: "fix" } })),
    ).toThrow(/Unknown key evidence.proof.pr_title/);
  });

  it("rejects a wrong schema tag", () => {
    expect(() => validateEvidenceEntry(evidence({ schema: "evidence.v2" }))).toThrow(
      /evidence.schema/,
    );
  });

  it("rejects a disposition outside the ratified set", () => {
    expect(() => validateEvidenceEntry(evidence({ disposition: "wontfix" }))).toThrow(
      /Invalid evidence.disposition/,
    );
  });

  it("rejects a recurrence_key that is not a stable slug", () => {
    expect(() => validateEvidenceEntry(evidence({ recurrence_key: "Main QA Skip" }))).toThrow(
      /evidence.recurrence_key/,
    );
  });

  it("rejects an observed_at that is not YYYY-MM-DD", () => {
    expect(() => validateEvidenceEntry(evidence({ observed_at: "2026-09-01T10:00:00Z" }))).toThrow(
      /evidence.observed_at/,
    );
  });

  it("rejects a proof.sha that is not a git object id", () => {
    expect(() => validateEvidenceEntry(evidence({ proof: { sha: "HEAD~1" } }))).toThrow(
      /evidence.proof.sha/,
    );
  });

  it("rejects a strategy id that would escape its directory", () => {
    expect(() => validateEvidenceEntry(evidence({ strategy: "../../etc" }))).toThrow(
      /path separators/,
    );
  });
});

describe("validateClaimRecord", () => {
  it("accepts a well-formed claim", () => {
    expect(validateClaimRecord(claim())).toEqual(claim());
  });

  it("rejects an unknown key, naming it", () => {
    expect(() => validateClaimRecord(claim({ pr_body: "expected diff" }))).toThrow(
      /Unknown key claim.pr_body/,
    );
  });

  it("rejects an unknown holder key", () => {
    expect(() =>
      validateClaimRecord(
        claim({ holder: { session: "s", worktree: "w", branch: "b", pid: 7 } }),
      ),
    ).toThrow(/Unknown key claim.holder.pid/);
  });

  it("requires expires_at", () => {
    const withoutExpiry = claim();
    delete withoutExpiry.expires_at;
    expect(() => validateClaimRecord(withoutExpiry)).toThrow(/claim.expires_at/);
  });

  it("rejects an expires_at at or before claimed_at", () => {
    expect(() => validateClaimRecord(claim({ expires_at: "2026-09-01T10:00:00Z" }))).toThrow(
      /must be after claim.claimed_at/,
    );
  });

  it("rejects a millisecond timestamp, which would break lexicographic ordering", () => {
    expect(() => validateClaimRecord(claim({ claimed_at: "2026-09-01T10:00:00.123Z" }))).toThrow(
      /YYYY-MM-DDTHH:MM:SSZ/,
    );
  });

  it("rejects a duplicated bite id", () => {
    expect(() => validateClaimRecord(claim({ bite: ["criterion-3", "criterion-3"] }))).toThrow(
      /Duplicate id "criterion-3" in claim.bite/,
    );
  });

  it("rejects a non-integer pr", () => {
    expect(() => validateClaimRecord(claim({ pr: 31.4 }))).toThrow(/claim.pr/);
  });

  it("rejects a claim_id carrying a path separator", () => {
    expect(() => validateClaimRecord(claim({ claim_id: "a/b" }))).toThrow(/path separators/);
  });
});

describe("canonicalization", () => {
  it("is key-order independent, so the same fact hashes to one id", () => {
    const entry = evidence();
    const reordered = { observed_at: entry.observed_at, proof: entry.proof, ...entry };
    expect([...Object.keys(reordered)]).not.toEqual([...Object.keys(entry)]);
    expect(canonicalJson(reordered)).toBe(canonicalJson(entry));
    expect(contentHash12(reordered)).toBe(contentHash12(entry));
  });

  it("sorts nested object keys and preserves array order", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 }, list: ["z", "a"] })).toBe(
      '{"a":{"c":3,"d":2},"b":1,"list":["z","a"]}',
    );
  });

  it("derives the entry path from the observed date and a 12-hex-char content hash", () => {
    const entry = validateEvidenceEntry(evidence());
    expect(contentHash12(entry)).toMatch(/^[0-9a-f]{12}$/);
    expect(evidencePath("/store", entry)).toBe(
      join(
        "/store",
        "operational",
        "evidence",
        "strategy-graph-native-dispatch",
        `20260901-${contentHash12(entry)}.json`,
      ),
    );
  });

  it("puts claim records one file per claim under operational/claims", () => {
    expect(claimPath("/store", "claim-alpha")).toBe(
      join("/store", "operational", "claims", "claim-alpha.json"),
    );
  });
});

describe("appendEvidence", () => {
  it("is commutative: appending two entries in either order yields identical trees", () => {
    const first = evidence({ recurrence_key: "first-finding", finding: "One." });
    const second = evidence({
      strategy: "strategy-main-health",
      recurrence_key: "second-finding",
      finding: "Two.",
      observed_at: "2026-08-30",
    });

    const forward = tempDir();
    appendEvidence(forward, first);
    appendEvidence(forward, second);

    const reverse = tempDir();
    appendEvidence(reverse, second);
    appendEvidence(reverse, first);

    expect(treeSnapshot(reverse)).toEqual(treeSnapshot(forward));
    expect(Object.keys(treeSnapshot(forward))).toHaveLength(2);
  });

  it("is idempotent: appending the same entry twice is a no-op success at one path", () => {
    const dir = tempDir();
    const path = appendEvidence(dir, evidence());
    expect(appendEvidence(dir, evidence())).toBe(path);
    expect(Object.keys(treeSnapshot(dir))).toHaveLength(1);
  });

  it("refuses to overwrite an existing path holding different content", () => {
    const dir = tempDir();
    const path = appendEvidence(dir, evidence());
    writeFileSync(path, '{"schema":"evidence.v1","tampered":true}\n');
    expect(() => appendEvidence(dir, evidence())).toThrow(/Refusing to overwrite evidence entry/);
  });

  it("validates before writing, so an invalid entry leaves no file behind", () => {
    const dir = tempDir();
    expect(() => appendEvidence(dir, evidence({ criterion: null, gap: null }))).toThrow(
      IntentionSchemaError,
    );
    expect(treeSnapshot(dir)).toEqual({});
  });

  it("writes canonical JSON that round-trips through readEvidence", () => {
    const dir = tempDir();
    appendEvidence(dir, evidence({ recurrence_key: "b-finding", finding: "B." }));
    appendEvidence(dir, evidence({ recurrence_key: "a-finding", finding: "A." }));
    const entries = readEvidence(dir, "strategy-graph-native-dispatch");
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.recurrence_key).sort()).toEqual(["a-finding", "b-finding"]);
    expect(listEvidence(dir)).toHaveLength(2);
  });

  it("reads no records from a store with no operational directory", () => {
    const dir = tempDir();
    expect(readEvidence(dir, "strategy-graph-native-dispatch")).toEqual([]);
    expect(listEvidence(dir)).toEqual([]);
    expect(listClaims(dir)).toEqual([]);
  });

  it("throws naming the file when a record on disk is malformed JSON", () => {
    const dir = tempDir();
    const path = appendEvidence(dir, evidence());
    writeFileSync(path, "{not json");
    expect(() => readEvidence(dir, "strategy-graph-native-dispatch")).toThrow(/Malformed JSON/);
  });

  it("leaves the node scan untouched: records live below the top-level *.md sweep", () => {
    const dir = tempDir();
    appendEvidence(dir, evidence());
    mintClaim(dir, claim());
    expect(readdirSync(dir)).toEqual(["operational"]);
  });
});

describe("mintClaim", () => {
  it("creates one file per claim and reads it back", () => {
    const dir = tempDir();
    expect(mintClaim(dir, claim())).toBe(claimPath(dir, "claim-alpha"));
    expect(readClaim(dir, "claim-alpha")).toEqual(claim());
  });

  it("is idempotent for an identical record", () => {
    const dir = tempDir();
    const path = mintClaim(dir, claim());
    expect(mintClaim(dir, claim())).toBe(path);
  });

  it("refuses to rewrite an existing claim id with different content", () => {
    const dir = tempDir();
    mintClaim(dir, claim());
    expect(() => mintClaim(dir, claim({ bite: ["criterion-9"] }))).toThrow(
      /Refusing to overwrite claim record/,
    );
  });

  it("lists claims sorted by id", () => {
    const dir = tempDir();
    mintClaim(dir, claim({ claim_id: "claim-beta" }));
    mintClaim(dir, claim({ claim_id: "claim-alpha" }));
    expect(listClaims(dir).map((c) => c.claim_id)).toEqual(["claim-alpha", "claim-beta"]);
  });

  it("ignores non-json files when listing", () => {
    const dir = tempDir();
    mintClaim(dir, claim());
    writeFileSync(join(dir, "operational", "claims", "README.md"), "notes\n");
    expect(listClaims(dir)).toHaveLength(1);
  });
});

describe("conflictingClaims", () => {
  const now = "2026-09-01T11:00:00Z";

  it("reports two live claims on one strategy with intersecting bites", () => {
    const a = validateClaimRecord(claim({ claim_id: "claim-a", bite: ["criterion-3", "criterion-4"] }));
    const b = validateClaimRecord(claim({ claim_id: "claim-b", bite: ["criterion-4", "criterion-5"] }));
    const conflicts = conflictingClaims([a, b], now);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlap).toEqual(["criterion-4"]);
    expect(conflicts[0].strategy).toBe("strategy-graph-native-dispatch");
    expect(conflicts[0].a.claim_id).toBe("claim-a");
    expect(conflicts[0].b.claim_id).toBe("claim-b");
  });

  it("reports no conflict for disjoint bites", () => {
    const a = validateClaimRecord(claim({ claim_id: "claim-a", bite: ["criterion-3"] }));
    const b = validateClaimRecord(claim({ claim_id: "claim-b", bite: ["criterion-4"] }));
    expect(conflictingClaims([a, b], now)).toEqual([]);
  });

  it("reports no conflict across different strategies", () => {
    const a = validateClaimRecord(claim({ claim_id: "claim-a" }));
    const b = validateClaimRecord(claim({ claim_id: "claim-b", strategy: "strategy-main-health" }));
    expect(conflictingClaims([a, b], now)).toEqual([]);
  });

  it("does not count an expired claim as live", () => {
    const expired = validateClaimRecord(
      claim({
        claim_id: "claim-expired",
        claimed_at: "2026-08-31T09:00:00Z",
        expires_at: "2026-09-01T10:30:00Z",
      }),
    );
    const live = validateClaimRecord(claim({ claim_id: "claim-live" }));
    expect(isClaimLive(expired, now)).toBe(false);
    expect(isClaimLive(live, now)).toBe(true);
    expect(conflictingClaims([expired, live], now)).toEqual([]);
  });

  it("treats a claim expiring exactly at now as expired", () => {
    const edge = validateClaimRecord(claim({ claim_id: "claim-edge", expires_at: now }));
    expect(isClaimLive(edge, now)).toBe(false);
  });

  it("rejects a now that is not a fixed-width UTC instant", () => {
    expect(() => conflictingClaims([validateClaimRecord(claim())], "2026-09-01")).toThrow(
      /YYYY-MM-DDTHH:MM:SSZ/,
    );
  });

  it("truncates milliseconds so lexicographic order stays chronological", () => {
    expect(utcInstant(new Date("2026-09-01T11:00:00.456Z"))).toBe(now);
    expect(() => conflictingClaims([validateClaimRecord(claim())])).not.toThrow();
  });
});
