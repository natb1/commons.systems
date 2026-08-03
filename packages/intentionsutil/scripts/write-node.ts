// Reads one intention node as JSON (from stdin or --file <path>) and writes it
// through the validated writeNode — the single validation gate. The intentions/
// directory is resolved from import.meta.url, not cwd, so the directory written
// is always the repo-canonical store the detector reads. No hand-authored
// markdown: every node that enters the store passes through writeNode/validateNode.
//
// Usage:
//   echo '<json>' | npx tsx intentionsutil/scripts/write-node.ts
//   npx tsx intentionsutil/scripts/write-node.ts --file path/to/node.json
//   npx tsx intentionsutil/scripts/write-node.ts --file path/to/node.json \
//     --strategy-fingerprint <strategy-id>=<hash> [--strategy-fingerprint ...] \
//     --strategy-sha <origin/main-sha>
//
// MINT-TIME STAMP. `--strategy-fingerprint` / `--strategy-sha` take the same
// keyed shape as `apply-node-transition.ts` (the router's transition-time
// stamp) and share its implementation via `lib-strategy-stamp.ts`:
// `--strategy-fingerprint` is repeatable and takes a KEYED
// `<strategy-id>=<hash>` value; the bare-hash form is rejected; a single
// `--strategy-sha` is required alongside and is shared across every entry.
//
// The flags close the mint-to-first-transition window. Transition-time seeding
// only starts once a tactic makes its first forward transition, and a tactic
// typically sits at `implement` — its longest phase — before that ever fires.
// A serving-strategy edit inside that window used to be laundered: the first
// transition seeded a FRESH hash computed against the already-edited strategy,
// so the soft-freeze had no stale stamp to compare against and never fired.
// Stamping at mint gives it one from the start.
//
// When the flags are absent the write is byte-identical to before: no
// `execution` object is fabricated and the payload is written exactly as
// validated.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeNode, readNode } from "../src/store.js";
import { validateNode, type IntentionNode } from "../src/schema.js";
import {
  type StrategyStampMap,
  defaultExecution,
  foldStrategyStampMap,
  mergeStrategyStamp,
  parseStrategyFingerprintEntry,
} from "./lib-strategy-stamp.js";

const PROG = "write-node";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/write-node.ts`, so the
// repo root is three directories up. Resolve from this file's own location,
// never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

// --- Args ------------------------------------------------------------------

export interface Args {
  /** Path to read the node JSON from; null means stdin. */
  file: string | null;
  /** Mint-time stamp to merge onto `execution.strategy_fingerprint`, or null. */
  strategyFingerprint: StrategyStampMap | null;
}

export function parseArgs(argv: string[]): Args {
  let file: string | null = null;
  let fingerprintHashes: Record<string, string> | null = null;
  let strategySha: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--file": {
        const v = argv[++i];
        if (v === undefined) throw new Error(`${PROG}: --file requires a path argument`);
        file = v;
        break;
      }
      case "--strategy-fingerprint": {
        const { sid, hash } = parseStrategyFingerprintEntry(PROG, argv[++i]);
        fingerprintHashes = { ...(fingerprintHashes ?? {}), [sid]: hash };
        break;
      }
      case "--strategy-sha":
        strategySha = argv[++i] ?? null;
        break;
      default:
        throw new Error(`${PROG}: unknown argument '${a}'`);
    }
  }
  return {
    file,
    strategyFingerprint: foldStrategyStampMap(PROG, fingerprintHashes, strategySha),
  };
}

// --- Core helper (exported for tests) --------------------------------------

/**
 * Parse `jsonText` and write it through `validateNode` + `writeNode`. Returns
 * the written node.
 *
 * `validateNode` is the single validation gate — it drops unknown keys, applies
 * defaults, and throws `IntentionSchemaError` on any missing/invalid field.
 *
 * When `strategyFingerprint` is given, the validated node is stamped BEFORE it
 * reaches disk: the keyed entries merge into `execution.strategy_fingerprint`,
 * seeding a fresh `execution` record when the payload has none (the ordinary
 * mint case, `execution: null`). Stamping is tactics-only — `execution` is
 * valid on tactics alone — so a stamp aimed at any other kind is a clear error
 * rather than a silently-dropped flag. Omitting the argument leaves the write
 * exactly as it was.
 */
export function writeNodeFromJson(
  intentionsDir: string,
  jsonText: string,
  strategyFingerprint: StrategyStampMap | null = null,
): IntentionNode {
  const parsed: unknown = JSON.parse(jsonText);
  const validated = validateNode(parsed);
  if (strategyFingerprint !== null) {
    if (validated.kind !== "tactic") {
      throw new Error(
        `${PROG}: --strategy-fingerprint is valid on tactics only, but ${validated.id} is kind '${validated.kind}'`,
      );
    }
    validated.execution = mergeStrategyStamp(
      validated.execution ?? defaultExecution(validated.id),
      strategyFingerprint,
    );
  }
  writeNode(intentionsDir, validated);
  return readNode(intentionsDir, validated.id);
}

// --- Main ------------------------------------------------------------------

function main(): void {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }

  const jsonText = readFileSync(args.file ?? "/dev/stdin", "utf8");
  const node = writeNodeFromJson(intentionsDir, jsonText, args.strategyFingerprint);
  const nodePath = join(intentionsDir, `${node.id}.md`);
  process.stdout.write(`wrote ${node.id} → ${nodePath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
