import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import type { Criterion, CriterionAuthority } from "../src/criteria.js";
import {
  CheckRegistry,
  HIGH_WATER_STRATEGY,
  PROMOTION_RECURRENCE_KEY,
  deriveTier,
  isPromotionFor,
  promotionRecord,
  type CheckContext,
  type CheckDeclaration,
  type CheckResult,
  type HighWaterSource,
} from "../src/checks.js";
import { StoreHighWater, readPromotions } from "../src/high-water.js";
import { evidenceDir } from "../src/operational-records.js";

const SHA = "0123456789abcdef0123";
const DATE = "2026-09-01";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "high-water-"));
}

function check(partial: Partial<CheckDeclaration> & { id: string }): CheckDeclaration {
  return {
    id: partial.id,
    criterion: partial.criterion ?? "criterion-1",
    describe: partial.describe ?? `Describes ${partial.id}`,
    run: partial.run ?? (() => result()),
  };
}

function result(partial: Partial<CheckResult> = {}): CheckResult {
  return {
    ok: partial.ok ?? true,
    detail: partial.detail ?? "ok",
    entries: partial.entries ?? [],
  };
}

function criterion(id: string, authority: CriterionAuthority): Criterion {
  return {
    id,
    statement: `Statement for ${id}`,
    class: "functional",
    authority,
    recorded: DATE,
  };
}

function criteriaMap(...criteria: Criterion[]): ReadonlyMap<string, Criterion> {
  return new Map(criteria.map((c) => [c.id, c]));
}

/** The seam, faked — `deriveTier` never sees a store in these tests. */
function fakeHighWater(...promoted: string[]): HighWaterSource {
  const set = new Set(promoted);
  return { has: (checkId) => set.has(checkId) };
}

// --- Registry ---------------------------------------------------------------
// Parity with `sensors.test.ts`'s SensorRegistry block, with the one
// deliberate divergence asserted at the end: duplicate registration THROWS.

describe("CheckRegistry", () => {
  it("registers then resolves a check", () => {
    const registry = new CheckRegistry();
    const declaration = check({ id: "validate-graph" });
    registry.register(declaration);
    expect(registry.resolve("validate-graph")).toBe(declaration);
  });

  it("throws IntentionSchemaError naming the missing id on an unregistered id", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "validate-graph" }));
    expect(() => registry.resolve("nope")).toThrow(IntentionSchemaError);
    expect(() => registry.resolve("nope")).toThrow(/nope/);
    // The error names the registered checks so the misconfiguration is debuggable.
    expect(() => registry.resolve("nope")).toThrow(/validate-graph/);
  });

  it("reports (none registered) for an empty registry", () => {
    const registry = new CheckRegistry();
    expect(() => registry.resolve("anything")).toThrow(/none registered/);
  });

  it("names() returns every registered id", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "b-check" }));
    registry.register(check({ id: "a-check" }));
    expect([...registry.names()].sort()).toEqual(["a-check", "b-check"]);
  });

  it("names() returns a snapshot: mutating it does not touch the registry", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "validate-graph" }));
    const names = registry.names() as Set<string>; // type-safety-ok: the snapshot guarantee is about the RETURNED object's runtime mutability, which the ReadonlySet type deliberately hides
    names.delete("validate-graph");
    names.add("phantom");
    expect([...registry.names()]).toEqual(["validate-graph"]);
    expect(() => registry.resolve("phantom")).toThrow(IntentionSchemaError);
  });

  it("names() is empty on construction — no default check set is hardcoded", () => {
    expect([...new CheckRegistry().names()]).toEqual([]);
  });

  it("throws on a duplicate id rather than overwriting (diverges from SensorRegistry)", () => {
    const registry = new CheckRegistry();
    const first = check({ id: "validate-graph", describe: "the first one" });
    registry.register(first);
    expect(() => registry.register(check({ id: "validate-graph" }))).toThrow(IntentionSchemaError);
    expect(() => registry.register(check({ id: "validate-graph" }))).toThrow(/already registered/);
    // The first registration survives: an overwrite would silently drop it from the sweep.
    expect(registry.resolve("validate-graph")).toBe(first);
  });
});

// --- The tier matrix --------------------------------------------------------
// Each row is asserted individually. The three non-`ratified` rows ARE the
// sanction gate; grouping them would let one of them regress unnoticed.

describe("deriveTier", () => {
  it("ratified + high-water => gating", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    const tier = deriveTier(
      declaration,
      criteriaMap(criterion("crit", "ratified")),
      fakeHighWater("c"),
    );
    expect(tier).toBe("gating");
  });

  it("ratified + NO high-water => observe (the ratchet conjunct)", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    const tier = deriveTier(declaration, criteriaMap(criterion("crit", "ratified")), fakeHighWater());
    expect(tier).toBe("observe");
  });

  it("delegated + high-water => observe (the sanction conjunct)", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    const tier = deriveTier(
      declaration,
      criteriaMap(criterion("crit", "delegated")),
      fakeHighWater("c"),
    );
    expect(tier).toBe("observe");
  });

  it("deferred + high-water => observe (the sanction conjunct)", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    const tier = deriveTier(
      declaration,
      criteriaMap(criterion("crit", "deferred")),
      fakeHighWater("c"),
    );
    expect(tier).toBe("observe");
  });

  it("delegated + NO high-water => observe", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    const tier = deriveTier(declaration, criteriaMap(criterion("crit", "delegated")), fakeHighWater());
    expect(tier).toBe("observe");
  });

  it("deferred + NO high-water => observe", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    const tier = deriveTier(declaration, criteriaMap(criterion("crit", "deferred")), fakeHighWater());
    expect(tier).toBe("observe");
  });

  it("an unbound criterion THROWS rather than defaulting to observe", () => {
    const declaration = check({ id: "c", criterion: "missing-crit" });
    const criteria = criteriaMap(criterion("crit", "ratified"));
    expect(() => deriveTier(declaration, criteria, fakeHighWater("c"))).toThrow(
      IntentionSchemaError,
    );
    expect(() => deriveTier(declaration, criteria, fakeHighWater("c"))).toThrow(/missing-crit/);
    // The error names the check and the criteria in force, so the registry defect is locatable.
    expect(() => deriveTier(declaration, criteria, fakeHighWater("c"))).toThrow(/"c"/);
    expect(() => deriveTier(declaration, criteria, fakeHighWater("c"))).toThrow(/crit/);
  });

  it("an unbound criterion against an EMPTY criteria set throws too", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    expect(() => deriveTier(declaration, criteriaMap(), fakeHighWater("c"))).toThrow(
      /none in force/,
    );
  });

  it("keys the high-water lookup by CHECK id, not criterion id", () => {
    const declaration = check({ id: "c", criterion: "crit" });
    // Promoted under the criterion id — the wrong key — so the tier stays observe.
    const tier = deriveTier(
      declaration,
      criteriaMap(criterion("crit", "ratified")),
      fakeHighWater("crit"),
    );
    expect(tier).toBe("observe");
  });
});

// --- The promotion record ---------------------------------------------------

describe("promotionRecord", () => {
  it("builds a valid evidence.v1 entry carrying the check id as proof.check", () => {
    const entry = promotionRecord(check({ id: "validate-graph", criterion: "crit" }), SHA, DATE);
    expect(entry.schema).toBe("evidence.v1");
    expect(entry.strategy).toBe(HIGH_WATER_STRATEGY);
    expect(entry.criterion).toBe("crit");
    expect(entry.gap).toBeNull();
    expect(entry.disposition).toBeNull();
    expect(entry.claim).toBeNull();
    expect(entry.proof).toEqual({ sha: SHA, pr: null, stamp: null, check: "validate-graph" });
    expect(entry.recurrence_key).toBe(PROMOTION_RECURRENCE_KEY);
    expect(entry.observed_at).toBe(DATE);
    expect(entry.finding).toContain("validate-graph");
    expect(entry.finding).toContain(SHA);
  });

  it("round-trips through the store's append path", () => {
    const dir = tempDir();
    const entry = promotionRecord(check({ id: "validate-graph" }), SHA, DATE);
    new StoreHighWater(dir).promote(check({ id: "validate-graph" }), SHA, DATE);
    expect(readPromotions(dir)).toEqual([entry]);
  });

  it("is deterministic: the same inputs build byte-identical entries", () => {
    const a = promotionRecord(check({ id: "c" }), SHA, DATE);
    const b = promotionRecord(check({ id: "c" }), SHA, DATE);
    expect(a).toEqual(b);
  });

  it("rejects a malformed sha at build time rather than on disk", () => {
    expect(() => promotionRecord(check({ id: "c" }), "NOT-A-SHA", DATE)).toThrow(
      IntentionSchemaError,
    );
  });

  it("rejects a non-date observedAt — the date is injected, so it is validated", () => {
    expect(() => promotionRecord(check({ id: "c" }), SHA, "2026-09-01T00:00:00Z")).toThrow(
      IntentionSchemaError,
    );
  });

  it("isPromotionFor matches the built record and only for its own check id", () => {
    const entry = promotionRecord(check({ id: "c" }), SHA, DATE);
    expect(isPromotionFor(entry, "c")).toBe(true);
    expect(isPromotionFor(entry, "other")).toBe(false);
  });
});

// --- The store-backed ratchet ----------------------------------------------

describe("StoreHighWater", () => {
  it("has() is false for an untouched store — an absent directory is not an error", () => {
    const highWater = new StoreHighWater(tempDir());
    expect(highWater.has("c")).toBe(false);
    expect([...highWater.promotedCheckIds()]).toEqual([]);
  });

  it("appends a promotion, then has() reports it", () => {
    const dir = tempDir();
    const highWater = new StoreHighWater(dir);
    expect(highWater.has("c")).toBe(false);
    highWater.promote(check({ id: "c" }), SHA, DATE);
    expect(highWater.has("c")).toBe(true);
    expect(highWater.has("other")).toBe(false);
  });

  it("a fresh reader sees a promotion another instance appended", () => {
    const dir = tempDir();
    new StoreHighWater(dir).promote(check({ id: "c" }), SHA, DATE);
    expect(new StoreHighWater(dir).has("c")).toBe(true);
  });

  it("re-appending the identical promotion is an idempotent no-op — one file", () => {
    const dir = tempDir();
    const highWater = new StoreHighWater(dir);
    const first = highWater.promote(check({ id: "c" }), SHA, DATE);
    const second = highWater.promote(check({ id: "c" }), SHA, DATE);
    expect(second).toBe(first);
    expect(readdirSync(evidenceDir(dir, HIGH_WATER_STRATEGY))).toHaveLength(1);
    expect(highWater.has("c")).toBe(true);
  });

  it("a later pass at a different sha is additive and leaves the ratchet latched", () => {
    const dir = tempDir();
    const highWater = new StoreHighWater(dir);
    highWater.promote(check({ id: "c" }), SHA, DATE);
    highWater.promote(check({ id: "c" }), "abcdef0123456789abcd", "2026-09-02");
    expect(readdirSync(evidenceDir(dir, HIGH_WATER_STRATEGY))).toHaveLength(2);
    expect(highWater.has("c")).toBe(true);
    expect([...new StoreHighWater(dir).promotedCheckIds()]).toEqual(["c"]);
  });

  it("appends in either order converge on the same set of files", () => {
    const forward = tempDir();
    new StoreHighWater(forward).promote(check({ id: "a" }), SHA, DATE);
    new StoreHighWater(forward).promote(check({ id: "b" }), SHA, DATE);
    const reverse = tempDir();
    new StoreHighWater(reverse).promote(check({ id: "b" }), SHA, DATE);
    new StoreHighWater(reverse).promote(check({ id: "a" }), SHA, DATE);
    const read = (dir: string) =>
      readdirSync(evidenceDir(dir, HIGH_WATER_STRATEGY))
        .sort()
        .map((name) => readFileSync(join(evidenceDir(dir, HIGH_WATER_STRATEGY), name), "utf8"));
    expect(read(forward)).toEqual(read(reverse));
    expect([...new StoreHighWater(forward).promotedCheckIds()].sort()).toEqual(["a", "b"]);
  });

  it("promotedCheckIds() returns a snapshot: mutating it does not touch the ratchet", () => {
    const dir = tempDir();
    const highWater = new StoreHighWater(dir);
    highWater.promote(check({ id: "c" }), SHA, DATE);
    const ids = highWater.promotedCheckIds() as Set<string>; // type-safety-ok: same as the registry snapshot test — probing runtime mutability the ReadonlySet type hides
    ids.delete("c");
    expect(highWater.has("c")).toBe(true);
  });

  it("reload() picks up a foreign append the memoized snapshot had missed", () => {
    const dir = tempDir();
    const reader = new StoreHighWater(dir);
    expect(reader.has("c")).toBe(false); // takes the snapshot
    new StoreHighWater(dir).promote(check({ id: "c" }), SHA, DATE);
    expect(reader.has("c")).toBe(false); // memoized, deliberately
    reader.reload();
    expect(reader.has("c")).toBe(true);
  });

  it("drives deriveTier end to end: observe before the promotion, gating after", () => {
    const dir = tempDir();
    const highWater = new StoreHighWater(dir);
    const declaration = check({ id: "c", criterion: "crit" });
    const criteria = criteriaMap(criterion("crit", "ratified"));
    expect(deriveTier(declaration, criteria, highWater)).toBe("observe");
    highWater.promote(declaration, SHA, DATE);
    expect(deriveTier(declaration, criteria, highWater)).toBe("gating");
  });

  it("files promotions under the reserved bucket, not under any real strategy", () => {
    const dir = tempDir();
    const path = new StoreHighWater(dir).promote(check({ id: "c" }), SHA, DATE);
    expect(path.startsWith(evidenceDir(dir, HIGH_WATER_STRATEGY))).toBe(true);
    expect(HIGH_WATER_STRATEGY.startsWith("strategy-")).toBe(false);
  });
});

// --- What a check reports ---------------------------------------------------

describe("CheckResult", () => {
  it("carries the frontier seeds behind a verdict, so a failure is a list not a bare red", () => {
    const declaration = check({
      id: "c",
      run: (ctx: CheckContext) =>
        result({
          ok: false,
          detail: `2 files under ${ctx.repoRoot} remain unmigrated`,
          entries: [
            { subject: "packages/a.ts", detail: "still calls the retired helper" },
            { subject: "packages/b.ts", detail: "still calls the retired helper" },
          ],
        }),
    });
    const outcome = declaration.run({
      repoRoot: "/repo",
      storeDir: "/repo/intentions",
      nodes: [],
    });
    expect(outcome.ok).toBe(false);
    // The verdict is a LIST of remaining work, which is what makes an
    // observe-tier failure a migration frontier rather than a bare red.
    expect(outcome.entries.map((entry) => entry.subject)).toEqual([
      "packages/a.ts",
      "packages/b.ts",
    ]);
    expect(outcome.detail).toContain("unmigrated");
  });
});
