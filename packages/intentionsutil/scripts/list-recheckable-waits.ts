// list-recheckable-waits — thin CLI over the pure wait-classification
// enumerator (tactic-wait-calendar-release Unit 2).
//
// Prints every WAIT node in the store that still holds its source, tagged
// with what the sweep must do about it: release it (`due`), leave it alone
// (`waiting`), escalate it (`capped`), or report it for visibility only
// (`malformed`).
//
// It is a pure read-only enumeration + printing wrapper over
// `listWaitCandidates` (src/wait-sweep.ts). No graph writes, no git, no gh.
//
// Usage:
//   node --import tsx/esm list-recheckable-waits.ts --dir <intentions-dir> [--now <iso>]
//
//   --dir (required) the intentions store directory the nodes load from.
//   --now (optional) the current instant as an ISO string, defaults to
//         `new Date().toISOString()`. This is the test seam.
//
// Stdout: one TSV line per candidate,
//   `<wait-id>\t<source-id>\t<attempts>\t<wait-until>\t<class>`
// (nothing when there are no candidates).
// Exit 0 on success; exit 2 on a usage error or a malformed store.

import { pathToFileURL } from "node:url";
import { listNodesStrict } from "../src/store.js";
import { listWaitCandidates } from "../src/wait-sweep.js";

export interface WaitSweepOpts {
  dir: string;
  now: string;
}

function parseArgs(argv: string[]): WaitSweepOpts {
  let dir: string | null = null;
  let now: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      const v = argv[++i];
      if (v === undefined || v === "")
        throw new Error("list-recheckable-waits: --dir requires a directory argument");
      dir = v;
    } else if (arg === "--now") {
      const v = argv[++i];
      if (v === undefined || v === "")
        throw new Error("list-recheckable-waits: --now requires an ISO instant argument");
      now = v;
    } else {
      throw new Error(`list-recheckable-waits: unknown argument '${arg}'`);
    }
  }
  if (dir === null) {
    throw new Error("usage: list-recheckable-waits.ts --dir <intentions-dir> [--now <iso>]");
  }
  return { dir, now: now ?? new Date().toISOString() };
}

function main(argv: string[]): void {
  const { dir, now } = parseArgs(argv);
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) {
    throw new Error(`list-recheckable-waits: --now "${now}" does not parse as a date`);
  }
  // STRICT by contract: this enumerator is a decision-making caller — its
  // output drives the wait sweep's graph writes (release/re-arm/escalate).
  // The tolerant `listNodes` would drop an unreadable `<id>.md` with only a
  // stderr warning while still exiting 0, so the sweep would report
  // `status=ok` for an enumeration that silently lost waits. `listNodesStrict`
  // throws instead, which the CLI wrapper turns into exit 2.
  const nodes = listNodesStrict(dir);
  for (const c of listWaitCandidates(nodes, nowMs)) {
    process.stdout.write(
      `${c.waitId}\t${c.sourceId}\t${c.attempts}\t${new Date(c.waitUntil).toISOString()}\t${c.cls}\n`,
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
