// list-unclaimed-hold-alerts — thin CLI over the pure unclaimed-hold alert
// enumerator (tactic-unclaimed-hold-alerting Unit 3).
//
// Prints every manual-policy hold that has sat unclaimed in the office-hours
// queue for at least `--min-age-seconds` while blocking a source among the
// graph's top `--top-k` live, unparked, eligible nodes.
//
// It is a pure read-only enumeration + printing wrapper over
// `listUnclaimedHoldAlerts` (src/hold-alerts.ts). No graph writes, no git, no
// gh, no daemon.
//
// Usage:
//   node --import tsx/esm list-unclaimed-hold-alerts.ts \
//     --dir <intentions-dir> --min-age-seconds <n> --top-k <n> [--now <iso8601>]
//
//   --dir              (required) the intentions store directory nodes load from.
//   --min-age-seconds  (required) minimum unclaimed age, inclusive.
//   --top-k            (required) how many top-ranked live nodes count as
//                      "important" for the blocked-source gate.
//   --now              (optional) the clock to measure age against; defaults to
//                      the current time.
//
// Stdout: one TSV line per alert,
//   `<hold-id>\t<source-id>\t<kind>\t<age-seconds>\t<source-tier>\t<source-band>\t<source-score>`
// (nothing when there are no alerts).
//
// COLUMN CONTRACT: columns 1-5 are unchanged and never reordered. When the
// resolved rank became the `(tier, band, score, depth)` quadruple, column 6
// (formerly the single `source-value`) became `source-band` and `source-score`
// was APPENDED as column 7 — appended, not inserted, so a positional reader that
// only wants the ids/kind/age keeps working.
// `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch` is the one
// reader in this repo; it reads the row with a 7-variable `IFS=$'\t' read`.
// Exit 0 on success; exit 2 on a usage error or a malformed store.
//
// NOTE: this is a SEPARATE CLI from list-recheckable-holds.ts on purpose. That
// script's four-column TSV is read by lib-stale-hold-recheck.sh with a
// four-variable `read`, so an appended column there would land inside `cls`.

import { pathToFileURL } from "node:url";
import { listNodesStrict } from "../src/store.js";
import { listUnclaimedHoldAlerts } from "../src/hold-alerts.js";

export interface HoldAlertCliOpts {
  dir: string;
  now: Date;
  minAgeSeconds: number;
  topK: number;
}

/** Parse a required non-negative integer flag value; throws on anything else. */
function parseCount(raw: string, flag: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(
      `list-unclaimed-hold-alerts: ${flag} requires a non-negative integer, got '${raw}'`,
    );
  }
  return n;
}

function parseArgs(argv: string[]): HoldAlertCliOpts {
  let dir: string | null = null;
  let now: Date | null = null;
  let minAgeSeconds: number | null = null;
  let topK: number | null = null;

  const requireValue = (v: string | undefined, flag: string): string => {
    if (v === undefined || v === "")
      throw new Error(`list-unclaimed-hold-alerts: ${flag} requires an argument`);
    return v;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      dir = requireValue(argv[++i], "--dir");
    } else if (arg === "--now") {
      const raw = requireValue(argv[++i], "--now");
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`list-unclaimed-hold-alerts: --now is not a valid ISO-8601 date: '${raw}'`);
      }
      now = parsed;
    } else if (arg === "--min-age-seconds") {
      minAgeSeconds = parseCount(requireValue(argv[++i], "--min-age-seconds"), "--min-age-seconds");
    } else if (arg === "--top-k") {
      topK = parseCount(requireValue(argv[++i], "--top-k"), "--top-k");
    } else {
      throw new Error(`list-unclaimed-hold-alerts: unknown argument '${arg}'`);
    }
  }

  // Every gate is explicit: a missing threshold is a usage error, never a
  // silent default that would quietly change which holds alert.
  if (dir === null || minAgeSeconds === null || topK === null) {
    throw new Error(
      "usage: list-unclaimed-hold-alerts.ts --dir <intentions-dir> " +
        "--min-age-seconds <n> --top-k <n> [--now <iso8601>]",
    );
  }
  return { dir, now: now ?? new Date(), minAgeSeconds, topK };
}

function main(argv: string[]): void {
  const { dir, now, minAgeSeconds, topK } = parseArgs(argv);
  // STRICT by contract, for the same reason list-recheckable-holds.ts:52-58
  // gives: the tolerant `listNodes` would drop an unreadable `<id>.md` with only
  // a stderr warning while still exiting 0, so the alerting pass would silently
  // under-report — both the holds themselves and the top-K pool they are gated
  // against. `listNodesStrict` throws instead, which becomes exit 2.
  const nodes = listNodesStrict(dir);
  for (const a of listUnclaimedHoldAlerts(nodes, { now, minAgeSeconds, topK })) {
    process.stdout.write(
      `${a.holdId}\t${a.sourceId}\t${a.kind}\t${a.ageSeconds}\t${a.sourceTier}\t` +
        `${a.sourceBand}\t${a.sourceScore}\n`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(2);
  }
}
