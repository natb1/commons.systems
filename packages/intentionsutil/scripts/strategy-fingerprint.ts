// strategy-fingerprint — the single runnable CLI callsite for computing a
// strategy node's fingerprint (tactic-fingerprint-recipe-single-callsite).
//
// `strategyFingerprint(strategy)` (src/router.ts) is the canonical hash
// function producers compare against `execution.strategy_fingerprint` on a
// tactic. Before this script existed, producers hand-computed the prose
// recipe (sha256 over a JSON substance object) themselves, which historically
// produced wrong hashes. This script wraps `strategyFingerprint` verbatim so
// there is exactly one place that computes it from the command line.
//
// The intentions/ directory defaults to the one resolved from
// `import.meta.url`, not cwd, overridable by `--dir`. (dump-node.ts no longer
// has such a default — clarification 194/242 made its --dir required — and
// compute-freshness.ts takes explicit --snapshot/--stamp. This script is out of
// that clarification's scope.)
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/strategy-fingerprint.ts <strategy-id> [--dir <path>]
//
// Stdout: the fingerprint hex string, followed by a newline.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode } from "../src/store.js";
import { strategyFingerprint } from "../src/router.js";

// The script lives at `packages/intentionsutil/scripts/strategy-fingerprint.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const defaultIntentionsDir = join(repoRoot, "intentions");

const USAGE =
  "usage: strategy-fingerprint.ts <strategy-id> [--dir <intentions-dir>]\n" +
  "  Prints strategyFingerprint(strategy) for <strategy-id> to stdout.\n";

interface Args {
  id: string;
  dir: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { id: "", dir: defaultIntentionsDir };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--dir": {
        const value = argv[++i];
        if (value === undefined || value === "") {
          process.stderr.write(USAGE);
          process.exit(1);
        }
        out.dir = value;
        break;
      }
      case "--help":
      case "-h":
        process.stdout.write(USAGE);
        process.exit(0);
        break;
      default:
        if (a.startsWith("--")) throw new Error(`strategy-fingerprint: unknown flag '${a}'`);
        if (out.id !== "") throw new Error(`strategy-fingerprint: unexpected extra argument '${a}'`);
        out.id = a;
    }
  }
  if (out.id === "") throw new Error("strategy-fingerprint: <strategy-id> is required");
  return out;
}

/**
 * Core helper (exported for tests): read the node `id` from `dir` and return
 * its strategy fingerprint. Exits the process with a clear stderr message —
 * per this repo's code-style rule against silent fallbacks — when the node
 * does not exist or is not a `strategy` node.
 */
export function strategyFingerprintFor(dir: string, id: string): string {
  if (!existsSync(join(dir, `${id}.md`))) {
    process.stderr.write(`strategy-fingerprint: no node '${id}' found in ${dir}\n`);
    process.exit(1);
  }
  const node = readNode(dir, id);
  if (node.kind !== "strategy") {
    process.stderr.write(`strategy-fingerprint: node '${id}' has kind '${node.kind}', not 'strategy'\n`);
    process.exit(1);
  }
  return strategyFingerprint(node);
}

function main(argv: string[]): void {
  const args = parseArgs(argv);
  process.stdout.write(`${strategyFingerprintFor(args.dir, args.id)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
