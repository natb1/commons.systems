// attribute-spend — fold one `aggregate-usage.sh --json-out` document into the
// dispatch / office-hours / rsi / other split that
// `strategy-recursive-self-improvement` measures the harness by, and flag the
// recorded fitness-function deviation when dispatch fails to dominate.
//
// This is a THIN CLI. The attribution itself is not implemented here: the fold
// lives in `../src/spend.ts` (`spendBucketsFrom` + `attributeSpend`), which the
// rsi sensor in `read-sensors.ts` also calls. Re-deriving the shares here — in
// jq, or in a second copy of the map — would give the fitness function two
// denominators that could disagree, which is exactly the failure the single
// module exists to prevent.
//
// What IS here is the dominance check (`spendDeviation`), the rule the strategy
// states its fitness function in: dispatch is expected to out-spend every rival
// workflow, and a rival that reaches or passes it is a review trigger. It was
// previously a flag inside the retired `rsi-plan.md` render; it is re-expressed
// here as its own exported predicate so the render's retirement did not take
// the rule with it.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/attribute-spend.ts <usage-audit.json>
//
// Reads the document at the given path, prints the four-row fold with a TOTAL
// line, then either the SPEND-DEVIATION FLAG or the line saying it did not fire.
//
// Exit codes:
//   0  the fold printed — INCLUDING when the deviation flag fired. The flag is
//      a review trigger for its reader, not a failed run; the exit status is
//      reserved for "could not measure", so a caller can still tell a deviation
//      apart from a missing aggregate.
//   1  the input could not be read as an aggregate (missing, unparseable, or
//      not an `aggregate-usage.sh --json-out` document). Never defaulted to an
//      empty window: a fabricated all-zero fold would silently satisfy the
//      dominance check (`.claude/rules/code-style.md`).
//   2  usage error.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { attributeSpend, spendBucketsFrom } from "../src/spend.js";
import type { SpendBucket, WorkflowSpend } from "../src/spend.js";

const USAGE =
  "usage: attribute-spend.ts <usage-audit.json>\n" +
  "  Folds an `aggregate-usage.sh --json-out` document into the\n" +
  "  dispatch / office-hours / rsi / other per-workflow token split and flags\n" +
  "  the recorded fitness-function deviation (a rival workflow reaching\n" +
  "  dispatch's price-proxy spend). Report-only; writes nothing.\n";

/** Share as a whole-percent string, matching the rsi sensor's rendering. */
function pct(share: number): string {
  return `${(share * 100).toFixed(0)}%`;
}

/**
 * A fired dominance check: the workflows that reached or passed dispatch's
 * price-proxy spend in the audited window.
 */
export interface SpendDeviation {
  dispatch: WorkflowSpend;
  /** The rivals at or above dispatch, in the fold's render order. */
  rivals: WorkflowSpend[];
  /** One-line report text, naming each rival and its share. */
  detail: string;
}

/**
 * The strategy's recorded expectation, checked mechanically: dispatch is
 * expected to dominate the window's token spend. It failing to is a review
 * trigger, so it is a flag rather than a line of prose the reader has to notice.
 *
 * Ported unchanged from the `renderSpend` flag the retired `rsi-plan.md` render
 * carried — same `>=` threshold, same `other`-exclusion, same measured-window
 * guard:
 *
 * - `other` is NOT a rival. It is the unattributed remainder, so a big `other`
 *   means the `WORKFLOW_SKILLS` map needs extending, not that a workflow is
 *   outspending dispatch.
 * - `>=`, not `>`: a rival that has merely CAUGHT dispatch is already the
 *   condition the strategy says to review.
 * - An all-zero window flags nothing. With no spend measured, every rival ties
 *   dispatch at 0 and `>=` would fire on every empty aggregate.
 *
 * The measured-window guard reads the ATTRIBUTED rows only — dispatch and its
 * rivals — never `other`. Including `other` in it (as the retired render did)
 * meant a window whose whole spend sat in the unattributed remainder counted as
 * "measured", and then dispatch (0) tied every rival (0) under `>=` and the flag
 * fired naming rivals that had spent nothing. That is the same all-zero case the
 * guard exists to suppress, and the honest finding there is a `WORKFLOW_SKILLS`
 * map that needs extending — which the `other` row already says on its face.
 */
export function spendDeviation(spend: WorkflowSpend[]): SpendDeviation | null {
  const dispatch = spend.find((s) => s.workflow === "dispatch");
  const rivals = spend.filter((s) => s.workflow !== "dispatch" && s.workflow !== "other");
  if (dispatch === undefined) return null;
  const measured =
    dispatch.priceProxyUsd > 0 || rivals.some((r) => r.priceProxyUsd > 0);
  if (!measured) return null;
  const bigger = rivals.filter((r) => r.priceProxyUsd >= dispatch.priceProxyUsd);
  if (bigger.length === 0) return null;
  return {
    dispatch,
    rivals: bigger,
    detail:
      `dispatch (${pct(dispatch.share)}) does not outpace ` +
      bigger.map((r) => `${r.workflow} (${pct(r.share)})`).join(", ") +
      " — the fitness function's recorded expectation is that it dominates; review",
  };
}

interface Row {
  workflow: string;
  proxy: string;
  cost: string;
  turns: string;
  share: string;
}

/**
 * The printed fold: one row per workflow, a TOTAL row (so the four rows can be
 * checked against the window's own total), then the deviation verdict. Pure
 * over an already-folded `WorkflowSpend[]` so the flag is testable without a
 * transcript aggregate on disk.
 */
export function renderSpendFold(spend: WorkflowSpend[], source: string): string {
  const rows: Row[] = spend.map((s) => ({
    workflow: s.workflow,
    proxy: s.priceProxyUsd.toFixed(2),
    cost: s.costUsd.toFixed(2),
    turns: String(s.turns),
    share: pct(s.share),
  }));
  const total = spend.reduce(
    (acc, s) => ({
      proxy: acc.proxy + s.priceProxyUsd,
      cost: acc.cost + s.costUsd,
      turns: acc.turns + s.turns,
    }),
    { proxy: 0, cost: 0, turns: 0 },
  );
  const totalRow: Row = {
    workflow: "TOTAL",
    proxy: total.proxy.toFixed(2),
    cost: total.cost.toFixed(2),
    turns: String(total.turns),
    // Not a sum of the printed shares — those are rounded to whole percent and
    // need not add to 100. The four rows are the whole window by construction.
    share: total.proxy === 0 ? pct(0) : pct(1),
  };
  const header: Row = {
    workflow: "WORKFLOW",
    proxy: "PRICE PROXY USD",
    cost: "COST USD",
    turns: "TURNS",
    share: "SHARE",
  };
  const all = [header, ...rows, totalRow];
  const width = (col: keyof Row) => Math.max(...all.map((r) => r[col].length));
  const line = (r: Row) =>
    [
      r.workflow.padEnd(width("workflow")),
      r.proxy.padStart(width("proxy")),
      r.cost.padStart(width("cost")),
      r.turns.padStart(width("turns")),
      r.share.padStart(width("share")),
    ]
      .join("  ")
      .trimEnd();

  const out: string[] = [];
  out.push(`Per-workflow token spend — ${source}`);
  out.push("");
  out.push(line(header));
  for (const r of rows) out.push(line(r));
  out.push(line(totalRow));
  out.push("");

  const deviation = spendDeviation(spend);
  if (deviation === null) {
    out.push(
      "No spend deviation: dispatch outpaces every rival workflow, which is the " +
        "fitness function's recorded expectation.",
    );
  } else {
    out.push(`SPEND-DEVIATION FLAG: ${deviation.detail}`);
  }
  out.push(
    "",
    "This is the fitness function's DENOMINATOR only — what the window spent, " +
      "not what the spend bought.",
  );
  return out.join("\n");
}

/**
 * Read the aggregate at `path`, or throw with the path and the reason. No
 * fallback to an empty document: see the exit-code note at the top of the file.
 */
/** Narrow an unknown thrown value to a message string without a type cast. */
function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function readAggregate(path: string): Record<string, SpendBucket> {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `attribute-spend: cannot read usage aggregate '${path}': ${errMessage(err)}. ` +
        "Produce one with `.claude/skills/rsi-audit/scripts/aggregate-usage.sh --days <N> " +
        "--json-out tmp/usage-audit.json`.",
    );
  }
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `attribute-spend: '${path}' is not valid JSON: ${errMessage(err)}. ` +
        "Expected an `aggregate-usage.sh --json-out` document.",
    );
  }
  const buckets = spendBucketsFrom(doc);
  if (buckets === null) {
    throw new Error(
      `attribute-spend: '${path}' is not an aggregate-usage.sh --json-out document ` +
        "(no readable `by_phase` object). Refusing to report a zero fold for it.",
    );
  }
  return buckets;
}

function main(argv: string[]): void {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE);
    return;
  }
  const flag = argv.find((a) => a.startsWith("-"));
  if (flag !== undefined) {
    process.stderr.write(`attribute-spend: unknown argument "${flag}"\n` + USAGE);
    process.exit(2);
  }
  if (argv.length !== 1) {
    process.stderr.write(
      "attribute-spend: exactly one usage-aggregate path is required\n" + USAGE,
    );
    process.exit(2);
  }
  const path = argv[0];

  let buckets: Record<string, SpendBucket>;
  try {
    buckets = readAggregate(path);
  } catch (err) {
    process.stderr.write(`${errMessage(err)}\n`);
    process.exit(1);
  }
  process.stdout.write(renderSpendFold(attributeSpend(buckets), path) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
