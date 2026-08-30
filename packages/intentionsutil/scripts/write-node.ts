// Reads one intention node as JSON (from stdin or --file <path>) and writes it
// through the validated writeNode — the single validation gate. No hand-authored
// markdown: every node that enters the store passes through writeNode/validateNode.
//
// Usage — PREFER THE --file FORM; see the corruption warning below:
//   node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --dir <intentions-dir> --file path/to/node.json
//   echo '<json>' | node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --dir <intentions-dir>
//
// Spell it `node --import tsx/esm`, NOT `npx tsx`. The tsx CLI wrapper opens an
// IPC socket at startup, which the sandbox denies — `listen EPERM: operation
// not permitted /tmp/.../N.pipe`, thrown in `createIpcServer` before the
// wrapper parses its arguments, so it fails whatever script you point it at.
// `node --import tsx/esm` loads the same loader in-process, opens no socket,
// and runs sandboxed and unsandboxed alike (.claude/rules/sandbox.md,
// "npx tsx").
//
// WARNING — AN INLINE `echo '<json>' | ...` CORRUPTS NODE CONTENT SILENTLY.
// Shell metacharacters inside a node value are eaten by the shell before this
// script sees them, and nothing signals the damage: zsh deletes apostrophes and
// hands over still-valid JSON, so validateNode accepts it, writeNode writes it,
// and the run exits 0 with mangled content. Measured — the shell argument
//   '{"statement":"it's the author's call"}'
// reaches this script as `{"statement":"its the authors call"}`: valid JSON,
// two apostrophes gone, no warning anywhere. Found on PR #3146. Write the JSON
// to a file and pass `--file`. Reserve the stdin form for a producer that never
// routes the JSON through a shell string.
//
// `--dir <intentions-dir>` is REQUIRED and has no default
// (strategy-graph-native-dispatch clarification 194, ADOPTED; clarification 242
// scopes the conversion to validate-graph.ts / write-node.ts / dump-node.ts /
// clear-park). It used to resolve `<repoRoot>/intentions` from
// `import.meta.url`, which meant the store written was a property of WHICH COPY
// of this script ran, not of what the caller asked for: the 2026-08-05 recording
// session invoked the primary checkout's copy from a worktree and the amended
// strategy landed in the shared main checkout instead of the session's tree.
// Callers name the tree; a missing --dir is a usage error, never a fallback
// (.claude/rules/code-style.md).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { writeNode, readNode } from "../src/store.js";
import { validateNode, type IntentionNode } from "../src/schema.js";

const USAGE =
  "usage: write-node.ts --dir <intentions-dir> [--file <path>]\n" +
  "  Reads the node JSON from <path>, or from stdin when --file is omitted.\n";

// --- Core helper (exported for tests) --------------------------------------

/**
 * Parse `jsonText` and write it through `validateNode` + `writeNode`. Returns
 * the written node.
 *
 * `validateNode` is the single validation gate — it drops unknown keys, applies
 * defaults, and throws `IntentionSchemaError` on any missing/invalid field.
 */
export function writeNodeFromJson(intentionsDir: string, jsonText: string): IntentionNode {
  const parsed: unknown = JSON.parse(jsonText);
  const validated = validateNode(parsed);
  writeNode(intentionsDir, validated);
  return readNode(intentionsDir, validated.id);
}

// --- Main ------------------------------------------------------------------

/**
 * The intentions directory this run writes to, taken verbatim from `--dir`.
 * Deliberately no default — see the header note. Exits 1 (this script's existing
 * usage-error code) rather than falling back to a script-relative store.
 */
function parseIntentionsDir(args: string[]): string {
  const dirIdx = args.indexOf("--dir");
  const dir = dirIdx === -1 ? undefined : args[dirIdx + 1];
  if (dir === undefined || dir === "" || dir.startsWith("-")) {
    process.stderr.write(
      "write-node: --dir <intentions-dir> is required and has no default — name the store " +
        "to write to (e.g. `intentions`, or an absolute path into the checkout you mean to " +
        "mutate). This script no longer infers the store from its own file location.\n" +
        USAGE,
    );
    process.exit(1);
  }
  return dir;
}

function main(): void {
  const args = process.argv.slice(2);
  const intentionsDir = parseIntentionsDir(args);
  let jsonText: string;

  const fileIdx = args.indexOf("--file");
  if (fileIdx !== -1) {
    const filePath = args[fileIdx + 1];
    if (!filePath) {
      process.stderr.write("write-node: --file requires a path argument\n");
      process.exit(1);
    }
    jsonText = readFileSync(filePath, "utf8");
  } else {
    jsonText = readFileSync("/dev/stdin", "utf8");
  }

  const node = writeNodeFromJson(intentionsDir, jsonText);
  const nodePath = join(intentionsDir, `${node.id}.md`);
  process.stdout.write(`wrote ${node.id} → ${nodePath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
