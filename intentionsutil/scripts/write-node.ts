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
import { validateNode, type IntentionNode } from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `intentionsutil/scripts/write-node.ts`, so the repo
// root is two directories up. Resolve from this file's own location, never
// from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(scriptDir));
const intentionsDir = join(repoRoot, "intentions");

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
