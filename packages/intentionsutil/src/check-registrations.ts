/**
 * Check registrations: the concrete wiring-up call site for the incumbent
 * check corpus (unit 6 of tactic-migration-frontier-projection).
 *
 * `checks.ts` (unit 2) defines the `CheckDeclaration` shape and the
 * `CheckRegistry` container but hardcodes no default check set — "units 6-7
 * register the concrete checks". This module is that registration: one
 * `CheckDeclaration` per incumbent check script, each binding to a criterion
 * transcribed (or already standing) on the strategy whose target state the
 * check enforces.
 *
 * EVERY TRANSCRIBED CRITERION IS `authority: deferred`. A deferred criterion
 * can never sanction a gating check (`deriveTier`, `checks.ts`), so every
 * check registered here starts life at `observe` tier no matter how it
 * behaves — registering it changes nothing about what blocks anything. That is
 * the point: this module is the bootstrap census, not a promotion.
 *
 * NOT BARRELED. `run()` shells out via `node:child_process` (`execFileSync`),
 * so this module must never be re-exported from the browser-safe `graph.ts`
 * barrel — same reasoning, same precedent as `operational-store.ts`, which
 * also shells out and also carries no barrel entry. Import it directly:
 * `./check-registrations.js`.
 *
 * MIRRORS `read-sensors.ts`'s `registeredSensorNames()` SHAPE. `buildDefaultCheckRegistry()`
 * builds the registry once; `registeredCheckNames()` derives the membership
 * set FROM that registry rather than a hand-maintained list, so the set a
 * consumer (the registration census, a future runner) reads can never drift
 * from what is actually registered below.
 *
 * NO SUPPRESSION IS NOT AN OMISSION. `.github/scripts/check-test-integrity.sh`
 * deliberately carries no `<sensor>-ok:` marker — its own header says so, and
 * `.claude/rules/test-integrity.md` forbids any self-serve escape hatch for a
 * failing test. `CheckDeclaration` (`checks.ts`) has no marker field at all,
 * for exactly this reason: a registry field assuming every check supports a
 * same-line suppression marker would be a false uniformity this corpus
 * already contradicts. Nothing here re-derives or exposes a marker; each
 * check's `run()` simply reports whatever the underlying script's exit code
 * and output say.
 *
 * WHY REAL `run()` IMPLEMENTATIONS, NOT PLACEHOLDERS. Every check below
 * shells out to the actual incumbent script via its documented invocation
 * (`node --import tsx/esm` for the two TypeScript scripts per
 * `.claude/rules/sandbox.md`; the script's own path for the shell checks) and
 * reports `ok = exit code 0`. One check (`check-graph-fast-path`) is designed
 * around a CI push-event payload (`PUSHED_COMMITS`/`PUSHED_HEAD_SHA`) that is
 * absent outside that context; run here it fails closed with the script's own
 * clear diagnostic, which is an honest report of the real script's behavior in
 * this environment, not an invented placeholder — and because its criterion
 * is deferred, that failure can never gate anything.
 */
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { CheckRegistry, type CheckContext, type CheckDeclaration, type CheckResult, type FrontierEntrySeed } from "./checks.js";

// --- Shelling out ------------------------------------------------------------

interface ShellRunResult {
  ok: boolean;
  output: string;
}

/**
 * Run `cmd args...` in `cwd`, capturing combined stdout+stderr and never
 * throwing: a non-zero exit is a normal outcome for a check (it means the
 * check found something), not a defect in this runner.
 */
function runShell(cmd: string, args: readonly string[], cwd: string): ShellRunResult {
  try {
    const output = execFileSync(cmd, args, {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, output };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const combined = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
    return { ok: false, output: combined.length > 0 ? combined : (e.message ?? String(err)) };
  }
}

/** The trailing non-empty lines of `text`, for a compact `detail` string. */
function lastLines(text: string, n = 12): string {
  const lines = text
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  return lines.slice(-n).join("\n");
}

/** Uniform `detail` shape: pass/fail plus a bounded tail of the real output. */
function summarize(id: string, ok: boolean, output: string): string {
  const tail = lastLines(output);
  if (ok) return tail.length > 0 ? `${id}: passed (${tail.split("\n").slice(-1)[0]})` : `${id}: passed`;
  return tail.length > 0 ? `${id}: failed -- ${tail}` : `${id}: failed (no output)`;
}

/** `node --import tsx/esm <script> args...` — never `npx tsx` (`.claude/rules/sandbox.md`). */
function runTsScript(scriptAbsPath: string, args: readonly string[], cwd: string): ShellRunResult {
  return runShell(process.execPath, ["--import", "tsx/esm", scriptAbsPath, ...args], cwd);
}

// --- Generic declaration builders --------------------------------------------

interface ScriptCheckOpts {
  id: string;
  criterion: string;
  describe: string;
  /** Path to the script, relative to the repo root. */
  scriptRelPath: string;
  /** Extra argv, built from the live `CheckContext`. Defaults to none. */
  args?: (ctx: CheckContext) => string[];
}

/** A check that shells out to a shell script under the repo. */
function shellScriptCheck(opts: ScriptCheckOpts): CheckDeclaration {
  return {
    id: opts.id,
    criterion: opts.criterion,
    describe: opts.describe,
    run(ctx: CheckContext): CheckResult {
      const scriptPath = join(ctx.repoRoot, opts.scriptRelPath);
      const args = opts.args ? opts.args(ctx) : [];
      const { ok, output } = runShell(scriptPath, args, ctx.repoRoot);
      return { ok, detail: summarize(opts.id, ok, output), entries: [] };
    },
  };
}

/** A check that shells out to a TypeScript script via `node --import tsx/esm`. */
function tsScriptCheck(opts: ScriptCheckOpts): CheckDeclaration {
  return {
    id: opts.id,
    criterion: opts.criterion,
    describe: opts.describe,
    run(ctx: CheckContext): CheckResult {
      const scriptPath = join(ctx.repoRoot, opts.scriptRelPath);
      const args = opts.args ? opts.args(ctx) : [];
      const { ok, output } = runTsScript(scriptPath, args, ctx.repoRoot);
      return { ok, detail: summarize(opts.id, ok, output), entries: [] };
    },
  };
}

// --- .github/scripts/ ---------------------------------------------------------

const checkFirestoreQueryBounds = shellScriptCheck({
  id: "check-firestore-query-bounds",
  criterion: "fn-firestore-query-bounds",
  describe: "Every Firestore getDocs() call site is bounded by limit() or a query-bounds-ok marker",
  scriptRelPath: ".github/scripts/check-firestore-query-bounds.sh",
});

const checkGraphFastPath = shellScriptCheck({
  id: "check-graph-fast-path",
  criterion: "fn-graph-fast-path-scope",
  describe: "A graph/** fast-path push touches only intentions/, proven against the frozen commit list",
  scriptRelPath: ".github/scripts/check-graph-fast-path.sh",
  // No PUSHED_COMMITS / PUSHED_HEAD_SHA override: outside an actual push-event
  // job neither is set, and the script's own fail-closed branch reports that
  // plainly. See the module header — this is a correct report of the real
  // script's behavior in this environment, not a defect in this wrapper.
});

const checkPlaywrightVersionSync = shellScriptCheck({
  id: "check-playwright-version-sync",
  criterion: "fn-playwright-version-sync",
  describe: "The nix-provided playwright-driver chromium revision matches @playwright/test's expectation",
  scriptRelPath: ".github/scripts/check-playwright-version-sync.sh",
  // No PLAYWRIGHT_BROWSERS_PATH override: the script itself skips cleanly
  // (exit 0) when that env var is unset (outside the nix devshell), which is
  // its own documented no-op path, not a workaround this registration adds.
});

const checkTestIntegrity = shellScriptCheck({
  id: "check-test-integrity",
  criterion: "nf-test-integrity", // existing standing non-functional criterion (kind-strategy)
  describe: "No net-new test-skip/removal/weakening on the diff vs the resolved baseline",
  scriptRelPath: ".github/scripts/check-test-integrity.sh",
  args: (ctx) => ["--repo-root", ctx.repoRoot],
});

const checkTypeSafetyEscapes = shellScriptCheck({
  id: "check-type-safety-escapes",
  criterion: "nf-type-safety", // existing standing non-functional criterion (kind-strategy)
  describe: "No net-new type-safety escape hatch on added lines vs origin/main, absent a type-safety-ok marker",
  scriptRelPath: ".github/scripts/check-type-safety-escapes.sh",
  args: (ctx) => ["--repo-root", ctx.repoRoot],
});

// --- .claude/skills/dispatch-propagate/scripts/ -------------------------------

const lintDsDrift = shellScriptCheck({
  id: "lint-ds-drift",
  criterion: "fn-ds-token-drift",
  describe: "Net-new app CSS/TSX uses the design-system token vocabulary rather than raw literals",
  scriptRelPath: ".claude/skills/dispatch-propagate/scripts/lint-ds-drift.sh",
});

const lintProseRules = shellScriptCheck({
  id: "lint-prose-rules",
  criterion: "fn-dispatch-shell-prose-rules",
  describe: "No net-new echo|jq JSON-corruption trap and no net-new raw gh issue/pr porcelain in dispatch shell scripts",
  scriptRelPath: ".claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh",
});

const lintVendoredSkills = shellScriptCheck({
  id: "lint-vendored-skills",
  criterion: "fn-vendored-skill-integrity",
  describe: "Every vendored skill directory matches its own .upstream.json digests (integrity tier)",
  scriptRelPath: ".claude/skills/dispatch-propagate/scripts/lint-vendored-skills.sh",
  // Integrity tier only (no --local): the tier CI itself runs
  // (`run-lint.sh`), and the only tier that needs no local skill-root state.
});

const lintVerifyFencePaths = shellScriptCheck({
  id: "lint-verify-fence-paths",
  criterion: "fn-verify-fence-paths",
  describe: "Every path named in a live node's ```verify fence still exists on disk",
  scriptRelPath: ".claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh",
  args: (ctx) => ["--repo-root", ctx.repoRoot],
});

// --- packages/intentionsutil/scripts/ -----------------------------------------

const validateGraphCheck = tsScriptCheck({
  id: "validate-graph",
  criterion: "fn-graph-validate",
  describe:
    "validateGraph frontmatter rules, lintTacticBodies, validateGraphProseRefs, and the --strict-sensors registration pass",
  scriptRelPath: "packages/intentionsutil/scripts/validate-graph.ts",
  args: (ctx) => [ctx.storeDir, "--strict-sensors"],
});

/**
 * `write-class-census.ts` always exits 0 (it is an observe-mode report, never
 * a gate — see its own header). `ok` here is therefore derived from the
 * report's own "undeclared" count, not from the process exit code, and
 * `entries` are the actual undeclared call sites the report lists — the real
 * migration frontier this check exists to drain, not invented data.
 *
 * Binds to `fn-intent-orchestration-layer-boundary`, the layer-boundary
 * criterion owned by `tactic-intent-orchestration-layer-schema`'s surface and
 * recorded on `strategy-explicit-intent` — this check registers under that
 * existing criterion rather than minting a rival one (unit 6 scope).
 */
const UNDECLARED_COUNT_RE = /undeclared:\s+(\d+)/;
const UNDECLARED_SITES_MARKER = "Undeclared sites (the migration frontier";

function parseUndeclaredSites(output: string): FrontierEntrySeed[] {
  const idx = output.indexOf(UNDECLARED_SITES_MARKER);
  if (idx === -1) return [];
  const after = output.slice(idx).split("\n").slice(1);
  const seeds: FrontierEntrySeed[] = [];
  for (const rawLine of after) {
    const line = rawLine.trim();
    if (line.length === 0 || line === "(none)") break;
    seeds.push({ subject: line, detail: "undeclared writeNode() call site (write-class-census)" });
  }
  return seeds;
}

const writeClassCensus: CheckDeclaration = {
  id: "write-class-census",
  criterion: "fn-intent-orchestration-layer-boundary",
  describe: "writeNode call sites declare their write class (intent/orchestration) per the layer-boundary migration",
  run(ctx: CheckContext): CheckResult {
    const scriptPath = join(ctx.repoRoot, "packages/intentionsutil/scripts/write-class-census.ts");
    const { ok: ran, output } = runTsScript(scriptPath, [], ctx.repoRoot);
    if (!ran) {
      return {
        ok: false,
        detail: `write-class-census: script failed to run -- ${lastLines(output)}`,
        entries: [],
      };
    }
    const match = output.match(UNDECLARED_COUNT_RE);
    if (match === null) {
      // The report's shape changed underneath this parser — fail loudly
      // rather than silently reading it as zero undeclared sites
      // (.claude/rules/code-style.md: clear errors over defensive fallback).
      return {
        ok: false,
        detail: "write-class-census: could not parse the 'undeclared' count from the report",
        entries: [],
      };
    }
    const undeclaredCount = Number(match[1]);
    const entries = parseUndeclaredSites(output);
    return {
      ok: undeclaredCount === 0,
      detail: `write-class-census: ${undeclaredCount} undeclared writeNode() call site(s) remain`,
      entries,
    };
  },
};

// --- The registry -------------------------------------------------------------

/**
 * Build the default registry of incumbent-check declarations. Exported so the
 * registration set can be unit-tested directly, mirroring
 * `read-sensors.ts`'s `buildDefaultRegistry`.
 */
export function buildDefaultCheckRegistry(): CheckRegistry {
  const registry = new CheckRegistry();
  registry.register(checkFirestoreQueryBounds);
  registry.register(checkGraphFastPath);
  registry.register(checkPlaywrightVersionSync);
  registry.register(checkTestIntegrity);
  registry.register(checkTypeSafetyEscapes);
  registry.register(lintDsDrift);
  registry.register(lintProseRules);
  registry.register(lintVendoredSkills);
  registry.register(lintVerifyFencePaths);
  registry.register(validateGraphCheck);
  registry.register(writeClassCensus);
  return registry;
}

/**
 * The ids the default registry resolves — derived from the registry itself,
 * never hand-listed, for the same reason `registeredSensorNames()`
 * (`read-sensors.ts`) derives its set: a hand-list silently drifts the moment
 * a check is added above. `check-registration-census.ts` and unit 7's runner
 * both read membership from here.
 */
export function registeredCheckNames(): ReadonlySet<string> {
  return buildDefaultCheckRegistry().names();
}
