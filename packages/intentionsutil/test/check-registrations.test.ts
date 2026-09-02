import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildDefaultCheckRegistry, registeredCheckNames } from "../src/check-registrations.js";
import { parseCriteria, standingCriteria } from "../src/criteria.js";
import { listNodesStrict } from "../src/store.js";
import type { CheckContext } from "../src/checks.js";

// Same repo-root derivation lifecycle-sensor.test.ts uses against the live
// store: test/ -> intentionsutil -> packages -> repo root.
const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(testDir)));
const intentionsDir = join(repoRoot, "intentions");

describe("buildDefaultCheckRegistry", () => {
  it("registers the whole corpus with no duplicate ids", () => {
    // CheckRegistry.register throws on a duplicate id (checks.ts), so simply
    // building the registry without throwing already proves uniqueness.
    const registry = buildDefaultCheckRegistry();
    expect(registry.names().size).toBe(11);
  });

  it("registeredCheckNames() mirrors buildDefaultCheckRegistry().names()", () => {
    const registry = buildDefaultCheckRegistry();
    expect(registeredCheckNames()).toEqual(registry.names());
  });

  it("binds the two diff-scoped decay sensors to the existing standing criteria, not new ones", () => {
    const registry = buildDefaultCheckRegistry();
    expect(registry.resolve("check-test-integrity").criterion).toBe("nf-test-integrity");
    expect(registry.resolve("check-type-safety-escapes").criterion).toBe("nf-type-safety");
  });

  it("binds write-class-census to the layer-boundary criterion rather than a rival one", () => {
    const registry = buildDefaultCheckRegistry();
    expect(registry.resolve("write-class-census").criterion).toBe(
      "fn-intent-orchestration-layer-boundary",
    );
  });
});

// Anti-drift guard, forward direction: every registered check's criterion id
// must actually be recorded somewhere in the graph (the standing set, or some
// node's own attributes.criteria). This is the same direction
// validateRegisteredSensorNames (sensors.ts) checks for sensors — registry ->
// graph — exercised here against the live store so a drift shows up in unit
// CI too, and made FATAL here for the reason lifecycle-sensor.test.ts's
// analogous sensor test is fatal: an unbound check is a registry defect
// (checks.ts's deriveTier throws on exactly this), not a soft warning.
describe.skipIf(!existsSync(intentionsDir))("registered checks resolve a recorded criterion", () => {
  it("every registered check's criterion id is recorded in the graph", () => {
    const nodes = listNodesStrict(intentionsDir);
    const recorded = new Set<string>();
    for (const c of standingCriteria(nodes)) recorded.add(c.id);
    for (const node of nodes) {
      for (const c of parseCriteria(node)) recorded.add(c.id);
    }

    const registry = buildDefaultCheckRegistry();
    const unresolved: string[] = [];
    for (const id of registry.names()) {
      const criterion = registry.resolve(id).criterion;
      if (!recorded.has(criterion)) unresolved.push(`${id} -> ${criterion}`);
    }
    expect(unresolved).toEqual([]);
  });
});

// Smoke-test a couple of real run() implementations end to end against the
// live repo — these are genuinely fast checks (a diff-scoped shell scan, an
// env-gated no-op), so exercising the real subprocess here is cheap and
// catches an invocation-shape regression (a renamed flag, a moved script)
// that a mocked test would miss.
describe.skipIf(!existsSync(repoRoot))("run() against the live repo", () => {
  const ctx: CheckContext = { repoRoot, storeDir: intentionsDir, nodes: [] };

  it("check-type-safety-escapes runs and reports a well-shaped CheckResult", () => {
    const registry = buildDefaultCheckRegistry();
    const result = registry.resolve("check-type-safety-escapes").run(ctx);
    expect(typeof result.ok).toBe("boolean");
    expect(typeof result.detail).toBe("string");
    expect(result.detail.length).toBeGreaterThan(0);
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("check-playwright-version-sync runs and reports a well-shaped CheckResult", () => {
    const registry = buildDefaultCheckRegistry();
    const result = registry.resolve("check-playwright-version-sync").run(ctx);
    expect(typeof result.ok).toBe("boolean");
    expect(typeof result.detail).toBe("string");
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("write-class-census derives ok from the report's own undeclared count, not the exit code", () => {
    const registry = buildDefaultCheckRegistry();
    const result = registry.resolve("write-class-census").run(ctx);
    expect(result.detail).toMatch(/write-class-census: \d+ undeclared writeNode\(\) call site\(s\) remain/);
    // ok reflects whether the frontier is empty, so it must agree with entries.
    expect(result.ok).toBe(result.entries.length === 0);
  });
}, 30_000);
