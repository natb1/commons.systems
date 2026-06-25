// Reads one intention node as JSON (from stdin or --file <path>) and writes it
// through the validated writeNode — the single validation gate. The intentions/
// directory is resolved from import.meta.url, not cwd, so the directory written
// is always the repo-canonical store the detector reads. No hand-authored
// markdown: every node that enters the store passes through writeNode/validateNode.
//
// Usage:
//   echo '<json>' | npx tsx intentionsutil/scripts/write-node.ts
//   npx tsx intentionsutil/scripts/write-node.ts --file path/to/node.json

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeNode, readNode } from "../src/store.js";
import type { IntentionNodeInput } from "../src/schema.js";
import type { IntentionNode } from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `intentionsutil/scripts/write-node.ts`, so the repo
// root is two directories up. Resolve from this file's own location, never
// from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(scriptDir));
const intentionsDir = join(repoRoot, "intentions");

// --- Core helper (exported for tests) --------------------------------------

/**
 * Parse `jsonText` as an IntentionNodeInput, write it through the validated
 * `writeNode`, and return the written node.
 *
 * `writeNode`/`validateNode` is the single validation gate — unknown keys in
 * the parsed JSON are dropped by explicit field selection so the input object
 * is always well-typed. On schema error, `IntentionSchemaError` propagates to
 * the caller (non-zero exit when called from main).
 */
export function writeNodeFromJson(intentionsDir: string, jsonText: string): IntentionNode {
  const parsed: unknown = JSON.parse(jsonText);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Input JSON must be a plain object");
  }
  const obj = parsed as Record<string, unknown>;

  // Explicitly pick known IntentionNodeInput fields — drops unknown keys.
  const input: IntentionNodeInput = {
    id: obj["id"] as string,
    statement: obj["statement"] as string,
    owner: obj["owner"] as IntentionNodeInput["owner"],
    status: obj["status"] as IntentionNodeInput["status"],
    ...(obj["parent"] !== undefined && { parent: obj["parent"] as string | null }),
    ...(obj["rationale"] !== undefined && { rationale: obj["rationale"] as string | null }),
    ...(obj["reading"] !== undefined && { reading: obj["reading"] as string | null }),
    ...(obj["gap"] !== undefined && { gap: obj["gap"] as string | null }),
    ...(obj["clarifications"] !== undefined && {
      clarifications: obj["clarifications"] as IntentionNodeInput["clarifications"],
    }),
    ...(obj["tooling_goals"] !== undefined && {
      tooling_goals: obj["tooling_goals"] as IntentionNodeInput["tooling_goals"],
    }),
    ...(obj["success_signal"] !== undefined && {
      success_signal: obj["success_signal"] as IntentionNodeInput["success_signal"],
    }),
  };

  // writeNode validates (throws IntentionSchemaError on missing statement, bad
  // enum, or unsafe id) — do NOT add validation here.
  writeNode(intentionsDir, input);
  return readNode(intentionsDir, input.id);
}

// --- Main ------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
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
