// Decision-trace digest — mechanically assemble the candidate decision-trace
// events that strategy-explicit-intent's success signal names, so the owner can
// judge the threshold at an office-hours sitting.
//
// The strategy's observable is: "decisions trace to the graph — dialectic
// outputs cite node ids, a failed condition retires or re-derives a strategy, a
// calibration challenge moves a node"; its sensor is "owner review at
// office-hours" (`is_proxy: true`). A machine must NEVER auto-write that reading
// — human judgment records it. This script only assembles the raw candidate
// events from the graph's git history and prints them for the sitting; it writes
// nothing to the store and touches no network.
//
// All three observable clauses are graph-visible events, so the digest reads
// them from `git log -p -- intentions/` line-level patch heuristics — the same
// technique `readTacticVelocity` uses (`read-sensors.ts`).
//
// Run from anywhere (the repo root is resolved relative to this file, not cwd):
//   node --import tsx/esm packages/intentionsutil/scripts/trace-decisions.ts [--since <git-date>] [--json]
//
// `--since` accepts any git approxidate (default `30 days ago`); `--json` emits
// the events as a JSON array instead of the human-readable digest. A git failure
// (not a repo, bad `--since`) exits non-zero with the error — clear errors over
// fallbacks (`.claude/rules/code-style.md`); this is an operator-run script, not
// a total batch sensor.

import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/trace-decisions.ts`, so
// the repo root is three directories up. Resolve from this file's own location,
// never from cwd — the git scan runs with `cwd: repoRoot`.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

// --- Event model -----------------------------------------------------------

/** One of the three observable clauses a candidate event can attest. */
export type TraceClass = "dialectic-cites-node" | "condition-retires-strategy" | "calibration-moves-node";

/** Human-facing heading for each class, in observable-clause order. */
export const CLASS_LABELS: Record<TraceClass, string> = {
  "dialectic-cites-node": "Dialectic outputs cite node ids",
  "condition-retires-strategy": "A failed condition retires or re-derives a strategy",
  "calibration-moves-node": "A calibration challenge moves a node",
};

/** Stable class ordering for grouped output. */
export const CLASS_ORDER: TraceClass[] = [
  "dialectic-cites-node",
  "condition-retires-strategy",
  "calibration-moves-node",
];

/** One candidate decision-trace event surfaced from the graph's git history. */
export interface TraceEvent {
  /** ISO-8601 author date of the commit. */
  date: string;
  /** Abbreviated (7-char) commit hash. */
  commit: string;
  /** Node id the event touched, derived from the intentions file path. */
  node: string;
  /** Which observable clause this event attests. */
  eventClass: TraceClass;
  /** One-line human summary — the representative changed line (or a note). */
  summary: string;
}

// --- Patch heuristics ------------------------------------------------------

/** Unit-separator sentinel between the hash and date in the git `--format`.
 * A diff never contains this control character, so a header line is unambiguous. */
const COMMIT_SEP = String.fromCharCode(0x1f);

const STRATEGY_PATH = /^intentions\/strategy-[^/]+\.md$/;
const STRATEGY_OR_VIRTUE_PATH = /^intentions\/(strategy|virtue)-[^/]+\.md$/;
const NODE_PATH = /^intentions\/[^/]+\.md$/;

/** Added clarifications entry (`- question:` / `answer:`) on a strategy/virtue. */
const CLARIFICATION_LINE = /^\+\s*-?\s*(question|answer):/;

/** A strategy's substance/condition lines, added or removed (`success_signal`
 * block included via its nested keys). Only applied to strategy files. */
const STRATEGY_SUBSTANCE_LINE =
  /^[+-]\s*(statement|conditions|success_signal|observable|sensor|threshold|is_proxy):/;

/** An attention injection: the top-level `attention:` key toggling, or a nested
 * `boost:` / `override:` (both unambiguous — they appear only under attention). */
const ATTENTION_LINE = /^[+-]attention:|^[+-]\s+(boost|override):/;

/** Derive the node id from an `intentions/<id>.md` path. */
export function nodeIdFromPath(path: string): string {
  return path.replace(/^intentions\//, "").replace(/\.md$/, "");
}

/** Strip the diff `+`/`-` marker and surrounding whitespace for a summary. */
function summarize(line: string): string {
  const body = line.replace(/^[+-]\s*/, "").trim();
  return body.length > 120 ? body.slice(0, 117) + "..." : body;
}

/**
 * Scan `git log --since=<since> -p -- intentions/` and return the candidate
 * decision-trace events, one per (commit, node, class). A single commit editing
 * one node in several ways yields one event per class it attests; the first
 * matching changed line is kept as that class's summary.
 *
 * Throws on a git failure (not a repo, bad `--since`) — this is an operator-run
 * digest, not a total batch sensor, so the error surfaces rather than degrading.
 */
export function scanDecisionTrace(repoDir: string, since = "30 days ago"): TraceEvent[] {
  const patch = execFileSync(
    "git",
    [
      "log",
      `--since=${since}`,
      "--no-renames",
      // Distinctive sentinel per commit: hash <US> author-ISO-date. The unit
      // separator (COMMIT_SEP) never appears in a diff, so the header is
      // unambiguous.
      `--format=%H${COMMIT_SEP}%aI`,
      "-p",
      "--",
      "intentions/",
    ],
    {
      cwd: repoDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );

  const events: TraceEvent[] = [];
  // Dedup key `${commit}\x00${node}\x00${class}` -> already emitted.
  const seen = new Set<string>();

  let commit: string | null = null;
  let date: string | null = null;
  let path: string | null = null;
  let isDeletedFile = false;
  let isNewFile = false;

  // Class 3 needs a genuine before/after value transition, not a field merely
  // materializing. A multi-field commit that backfills a previously-absent
  // `attention: null` onto an existing file (e.g. a schema catch-up alongside
  // unrelated edits) shows only an added line with no removed counterpart —
  // that is field creation, not a calibration challenge moving a node. Buffer
  // attention-line signs per (commit, path) and only emit once BOTH an added
  // and a removed attention-related line have been seen for that file within
  // the current commit, flushing at each file/commit boundary.
  let attentionAdded = false;
  let attentionRemoved = false;
  // The added ("after") line is the more useful summary for a reviewer — it
  // shows what the value became, not what it stopped being. Fall back to the
  // removed line only if no added line matched (kept for defensive coverage;
  // not expected given the add+remove pairing this class requires).
  let attentionAddedSummary: string | null = null;
  let attentionRemovedSummary: string | null = null;
  let attentionAddedSummaryIsNested = false;
  let attentionRemovedSummaryIsNested = false;

  const emit = (node: string, eventClass: TraceClass, summary: string): void => {
    if (commit === null || date === null) return;
    const key = `${commit}\x00${node}\x00${eventClass}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push({ date, commit: commit.slice(0, 7), node, eventClass, summary });
  };

  const flushAttention = (): void => {
    if (path !== null && NODE_PATH.test(path) && attentionAdded && attentionRemoved) {
      const summary = attentionAddedSummary ?? attentionRemovedSummary ?? "attention changed";
      emit(nodeIdFromPath(path), "calibration-moves-node", summary);
    }
    attentionAdded = false;
    attentionRemoved = false;
    attentionAddedSummary = null;
    attentionRemovedSummary = null;
    attentionAddedSummaryIsNested = false;
    attentionRemovedSummaryIsNested = false;
  };

  for (const line of patch.split("\n")) {
    // A commit header is `<40-hex><COMMIT_SEP><iso-date>` — detect it by the
    // separator at offset 40 with a 40-hex prefix. Using a string separator
    // (not a control char in a regex literal) keeps the hash check clean.
    const sepIdx = line.indexOf(COMMIT_SEP);
    if (sepIdx === 40 && /^[0-9a-f]{40}$/.test(line.slice(0, 40))) {
      flushAttention();
      commit = line.slice(0, 40);
      date = line.slice(41);
      continue;
    }

    const fileHeader = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
    if (fileHeader !== null) {
      flushAttention();
      path = fileHeader[2];
      isDeletedFile = false;
      isNewFile = false;
      continue;
    }

    if (path === null || !NODE_PATH.test(path)) continue;

    if (line.startsWith("new file mode")) {
      // A brand-new node is authoring, not a change to an existing decision;
      // its content lines are excluded from all three classes.
      isNewFile = true;
      continue;
    }

    if (line.startsWith("deleted file mode")) {
      isDeletedFile = true;
      // A deleted strategy file is itself a class-2 event (a retired strategy).
      if (STRATEGY_PATH.test(path)) {
        emit(nodeIdFromPath(path), "condition-retires-strategy", "strategy file deleted");
      }
      continue;
    }

    // Diff bookkeeping lines (`+++`, `---`) start with the change markers but
    // are never content; skip them so they cannot match a heuristic.
    if (line.startsWith("+++") || line.startsWith("---")) continue;

    // A new file's added content is initial authoring, not a decision change.
    if (isNewFile) continue;

    const node = nodeIdFromPath(path);

    // Class 1 — dialectic outputs cite node ids (added clarifications entries).
    if (STRATEGY_OR_VIRTUE_PATH.test(path) && CLARIFICATION_LINE.test(line)) {
      emit(node, "dialectic-cites-node", summarize(line));
    }

    // Class 2 — a failed condition retires or re-derives a strategy (condition /
    // substance edits on a strategy; deletion handled above).
    if (STRATEGY_PATH.test(path) && !isDeletedFile && STRATEGY_SUBSTANCE_LINE.test(line)) {
      emit(node, "condition-retires-strategy", summarize(line));
    }

    // Class 3 — a calibration challenge moves a node (attention injection).
    // Buffered: only a paired add+remove within this (commit, path) is a real
    // value transition (see flushAttention above); a lone addition is a field
    // materializing (e.g. schema backfill), not a challenge.
    if (ATTENTION_LINE.test(line)) {
      // A nested `boost:`/`override:` line carries the actual value and is a
      // more useful summary than the bare top-level `attention:` line; prefer
      // it if one appears (in either position), but don't require it — a
      // bare `attention:` line alone is still a valid fallback summary.
      const isNested = /^[+-]\s+(boost|override):/.test(line);
      if (line.startsWith("+")) {
        attentionAdded = true;
        if (attentionAddedSummary === null || (isNested && !attentionAddedSummaryIsNested)) {
          attentionAddedSummary = summarize(line);
          attentionAddedSummaryIsNested = isNested;
        }
      } else {
        attentionRemoved = true;
        if (attentionRemovedSummary === null || (isNested && !attentionRemovedSummaryIsNested)) {
          attentionRemovedSummary = summarize(line);
          attentionRemovedSummaryIsNested = isNested;
        }
      }
    }
  }
  flushAttention();

  return events;
}

// --- Rendering -------------------------------------------------------------

/** Render the events as a human-readable digest grouped by class with counts. */
export function formatDigest(events: TraceEvent[], since: string): string {
  const lines: string[] = [];
  lines.push(`Decision-trace digest — candidate events since "${since}"`);
  lines.push(`(sensor is owner review at office-hours; this only assembles the candidates)`);
  lines.push("");

  for (const eventClass of CLASS_ORDER) {
    const group = events
      .filter((e) => e.eventClass === eventClass)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    lines.push(`${CLASS_LABELS[eventClass]} (${group.length})`);
    if (group.length === 0) {
      lines.push("  (none)");
    } else {
      for (const e of group) {
        lines.push(`  ${e.date.slice(0, 10)}  ${e.commit}  ${e.node}  ${e.summary}`);
      }
    }
    lines.push("");
  }

  lines.push(`Total candidate events: ${events.length}`);
  return lines.join("\n");
}

// --- CLI -------------------------------------------------------------------

interface Args {
  since: string;
  json: boolean;
}

/** Parse `--since <git-date>` and `--json`; unknown flags exit non-zero. */
export function parseArgs(argv: string[]): Args {
  let since = "30 days ago";
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      json = true;
    } else if (arg === "--since") {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new Error("--since requires a git-date argument");
      }
      since = value;
      i++;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { since, json };
}

function main(): void {
  const { since, json } = parseArgs(process.argv.slice(2));
  const events = scanDecisionTrace(repoRoot, since);
  if (json) {
    process.stdout.write(JSON.stringify(events, null, 2) + "\n");
  } else {
    process.stdout.write(formatDigest(events, since) + "\n");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
