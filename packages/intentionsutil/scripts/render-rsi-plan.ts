// render-rsi-plan — regenerate `rsi-plan.md` from graph state.
//
// `rsi-plan.md` is a DERIVED dashboard: `strategy-recursive-self-improvement`
// condition 5 makes every section a render of the graph, and a hand-edited
// section a defect. This script is the renderer. The `/rsi-plan` skill runs it;
// the `/rsi` main thread reads the staleness flags it emits and decides what to
// do about them (rendering here, judgment there — never mixed).
//
// Reads the store AT A GIT REF (default `origin/main`), not the local working
// tree, for the same reason `office-hours-select.ts` does: a renderer that reads
// its own checkout answers from whatever that worktree last synced, so a stale
// worktree silently publishes stale phases, stale parks and stale readings into
// a file that is then pushed to main as current. It never fetches — a caller
// that needs absolute freshness runs `git fetch origin main` first.
//
// Run from anywhere (the repo root is resolved relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/render-rsi-plan.ts
//   npx tsx packages/intentionsutil/scripts/render-rsi-plan.ts --check
//   npx tsx packages/intentionsutil/scripts/render-rsi-plan.ts --json
//
// Flags:
//   --out <path>    write here instead of `<repoRoot>/rsi-plan.md`
//   --ref <git-ref> read the store at this ref instead of `origin/main`
//   --date <D>      render date `YYYY-MM-DD`; defaults to today (UTC)
//   --usage <path>  usage aggregate JSON for per-workflow token attribution;
//                   defaults to `<repoRoot>/tmp/usage-audit.json`
//   --window <W>    label for the aggregate's window (default `7d`)
//   --check         render and compare against `--out` WITHOUT writing; exit 1
//                   when they differ (the "is the committed file stale?" gate)
//   --json          emit `{markdown, flags}` as JSON on stdout and write nothing
//
// Exit codes:
//   0  rendered (or, under --check, the file is already current)
//   1  --check found the file stale, or an argument was invalid
//   2  a required input could not be read (bad ref, unreadable store)
//
// Staleness flags always go to STDERR, one `FLAG <kind> <subject> — <detail>`
// line each, whatever the mode. They are the render's second output, not a
// debug aside: the `/rsi` judgment step consumes them.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodesAtRef } from "./lib-store-at-ref.js";
import { registeredSensorNames } from "./read-sensors.js";
import {
  attributeSpend,
  renderRsiPlan,
  spendBucketsFrom,
  type ParkedItem,
  type RsiRender,
  type WorkflowSpend,
} from "../src/rsi.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/render-rsi-plan.ts`, so
// the repo root is three directories up. Resolve from this file's own location,
// never from cwd — every other script in this directory does the same, and it
// is what lets `/rsi-plan` invoke this from a worktree.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

const USAGE = `usage: render-rsi-plan.ts [--out <path>] [--ref <git-ref>] [--date <YYYY-MM-DD>]
                          [--usage <path>] [--window <label>] [--check] [--json]
  Renders rsi-plan.md from the intention store at <git-ref> (default origin/main).
`;

interface Args {
  out: string;
  ref: string;
  date: string;
  usage: string;
  window: string;
  check: boolean;
  json: boolean;
}

/** Today in UTC as `YYYY-MM-DD`. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseArgs(argv: string[]): Args {
  const out: Args = {
    out: join(repoRoot, "rsi-plan.md"),
    ref: "origin/main",
    date: todayUtc(),
    usage: join(repoRoot, "tmp", "usage-audit.json"),
    window: "7d",
    check: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const takeValue = (name: string): string => {
      const value = argv[++i];
      if (value === undefined || value === "") {
        throw new Error(`render-rsi-plan: ${name} requires a value`);
      }
      return value;
    };
    switch (a) {
      case "--out":
        out.out = takeValue("--out");
        break;
      case "--ref":
        out.ref = takeValue("--ref");
        break;
      case "--date":
        out.date = takeValue("--date");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(out.date)) {
          throw new Error(`render-rsi-plan: --date must be YYYY-MM-DD, got '${out.date}'`);
        }
        break;
      case "--usage":
        out.usage = takeValue("--usage");
        break;
      case "--window":
        out.window = takeValue("--window");
        break;
      case "--check":
        out.check = true;
        break;
      case "--json":
        out.json = true;
        break;
      case "--help":
      case "-h":
        process.stdout.write(USAGE);
        process.exit(0);
        break;
      default:
        throw new Error(`render-rsi-plan: unknown argument '${a}'`);
    }
  }
  return out;
}

// --- Parked rows ------------------------------------------------------------

/**
 * Parse `office-hours-select.ts --list` output into rows.
 *
 * The selector's `--list` mode emits one TAB-separated
 * `score<TAB>type<TAB>id<TAB>since` row per parked node (four columns, pinned by
 * `formatQueueRow`; the first is the penalized `score` of the resolved rank
 * key), and — for a BANDED park — a following
 * `NOTE — <id> ranks at tier <t> band <b> via <source> (own score <s>)` line on
 * the SAME stream. The NOTE binds to the row above it, which is how a park
 * declares the parent it got its band from — and a park's blocked source is one
 * of its parents. Attaching it to the preceding row (rather than dropping it as
 * chatter) is the whole point of §3: it answers "what does this park block?".
 *
 * Exported for tests, which feed it captured selector output rather than
 * shelling out.
 */
export function parseParkedList(stdout: string): ParkedItem[] {
  const items: ParkedItem[] = [];
  for (const line of stdout.split("\n")) {
    const trimmed = line.trimEnd();
    if (trimmed === "") continue;
    if (trimmed.startsWith("NOTE —") || trimmed.startsWith("NOTE -")) {
      const last = items[items.length - 1];
      // A NOTE with no preceding row cannot be bound to anything; dropping it
      // is correct, but it must not be mistaken for a row.
      if (last !== undefined) last.note = trimmed.replace(/^NOTE\s+[—-]\s*/, "");
      continue;
    }
    const parts = trimmed.split("\t");
    if (parts.length < 4) continue;
    const rank = Number(parts[0]);
    if (!Number.isFinite(rank)) continue;
    items.push({ rank, sessionType: parts[1], id: parts[2], since: parts[3], note: null });
  }
  return items;
}

/**
 * Run the office-hours selector at `ref` and parse its rows.
 *
 * BOTH streams are parsed. The selector writes rows to stdout and its
 * `NOTE — <id> ranks at tier …` advisories to STDERR; a render that read stdout
 * alone would drop exactly the band-source lines §3 is built around. `spawnSync`
 * (not `execFileSync`) is used because it surfaces both captured streams — and
 * the two are interleaved by re-attaching each NOTE to the row it names, so the
 * binding survives the fact that the streams arrive separately.
 *
 * A non-zero exit is fatal (`.claude/rules/code-style.md`): an empty parked list
 * is a real, meaningful answer, so substituting one for a failed probe would
 * publish "nothing is parked" into a file that then gets pushed to main.
 */
function readParked(ref: string): ParkedItem[] {
  const script = join(scriptDir, "office-hours-select.ts");
  const proc = spawnSync("npx", ["tsx", script, "--list", "--ref", ref], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (proc.error !== undefined) {
    throw new Error(`office-hours-select could not be run: ${proc.error.message}`);
  }
  if (proc.status !== 0) {
    throw new Error(
      `office-hours-select --list exited ${proc.status ?? "on a signal"}: ${proc.stderr.trim()}`,
    );
  }
  const rows = parseParkedList(proc.stdout);
  // Second pass: bind the stderr NOTE advisories to the rows they name. Each
  // advisory begins `NOTE — <node-id> ranks at …`, so the id is its second
  // token; matching on that is exact, not positional.
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const line of proc.stderr.split("\n")) {
    const match = line.match(/^NOTE\s+[—-]\s*(\S+)\s+(.*)$/);
    if (match === null) continue;
    const row = byId.get(match[1]);
    if (row !== undefined) row.note = `${match[1]} ${match[2]}`.trim();
  }
  return rows;
}

// --- Token attribution ------------------------------------------------------

/**
 * Per-workflow spend from a `aggregate-usage.sh --json-out` document, or `null`
 * when the aggregate is absent or unreadable.
 *
 * `null` is not a fallback that hides an error: `renderRsiPlan` renders it as an
 * explicit "unavailable" line naming the command that produces the aggregate.
 * The alternative — zeros — would read as "rsi spent nothing", a false measured
 * claim, which matters because dispatch-dominance is a recorded review trigger.
 */
function readSpend(usagePath: string): WorkflowSpend[] | null {
  if (!existsSync(usagePath)) return null;
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(usagePath, "utf8"));
  } catch (err) {
    process.stderr.write(`render-rsi-plan: usage aggregate unreadable (${String(err)})\n`);
    return null;
  }
  const buckets = spendBucketsFrom(doc);
  if (buckets === null) {
    process.stderr.write(
      `render-rsi-plan: usage aggregate at ${usagePath} has no by_phase object\n`,
    );
    return null;
  }
  return attributeSpend(buckets);
}

// --- Main -------------------------------------------------------------------

function resolveSha(ref: string): string {
  return execFileSync("git", ["-C", repoRoot, "rev-parse", ref], {
    encoding: "utf8",
  }).trim();
}

export function render(args: Args): RsiRender {
  const nodes = listNodesAtRef(repoRoot, args.ref);
  return renderRsiPlan({
    nodes,
    parked: readParked(args.ref),
    spend: readSpend(args.usage),
    spendWindow: args.window,
    registeredSensors: registeredSensorNames(),
    ref: args.ref,
    sha: resolveSha(args.ref),
    generatedAt: args.date,
  });
}

function main(argv: string[]): void {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${String(err instanceof Error ? err.message : err)}\n${USAGE}`);
    process.exit(1);
  }

  let result: RsiRender;
  try {
    result = render(args);
  } catch (err) {
    process.stderr.write(
      `render-rsi-plan: ${String(err instanceof Error ? err.message : err)}\n`,
    );
    process.exit(2);
  }

  for (const flag of result.flags) {
    process.stderr.write(`FLAG ${flag.kind} ${flag.subject} — ${flag.detail}\n`);
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (args.check) {
    const current = existsSync(args.out) ? readFileSync(args.out, "utf8") : "";
    if (current === result.markdown) {
      process.stderr.write(`render-rsi-plan: ${args.out} is current\n`);
      return;
    }
    process.stderr.write(
      `render-rsi-plan: ${args.out} is STALE — re-render it (drop --check)\n`,
    );
    process.exit(1);
  }

  writeFileSync(args.out, result.markdown);
  process.stderr.write(
    `render-rsi-plan: wrote ${args.out} (${result.flags.length} flag(s))\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
