import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { parse, stringify } from "yaml";
import { isPlainObject, validateNode, type IntentionNode, type IntentionNodeInput } from "./schema.js";
import { IntentionSchemaError } from "./errors.js";
import { extractFrontmatter, extractBody } from "./frontmatter.js";

/**
 * Serialize a node to its on-disk form and write it to `<dir>/<id>.md`.
 *
 * The node is validated FIRST (defaults applied) so the written frontmatter is
 * complete and deterministic. For every kind, an existing file's markdown body
 * is preserved verbatim across rewrites (via `readExistingBody`) — bodies are
 * authoritative, durable content, not a cosmetic render of `statement` (see the
 * durable-body contract, tactic-nontactic-body-durability). Only a brand-new
 * file with no prior file on disk gets the generated `# ${statement}`
 * placeholder body.
 */
// Mirrors graph-commit's id validation exactly (packages/intentionsutil/scripts/graph-commit,
// the `case "$id" in` block): reject path separators, and `.`/`..` as EXACT ids
// only. `..` as a substring cannot traverse once `/` and `\` are banned (the id
// is only ever used as the single path component `<dir>/<id>.md`), so ids like
// `v1..v2-migration` are legal — rejecting them here would silently defeat
// graph-commit's relaxed check, since every id passes through this gate first
// via write-node.ts before graph-commit ever sees it.
// Exported so every consumer that turns an id into a path component — not just
// the `readNode`/`writeNode` disk paths in this module — can apply the SAME
// check. `restamp-scope-fingerprint.ts` calls it at its single stamp-write seam
// (`writeScopeStamp`), which is reachable from a content source that never
// touches `readNode`.
export function assertPathSafeId(id: string): void {
  if (id.includes("/") || id.includes("\\")) {
    throw new IntentionSchemaError(
      `Node id contains path separators: "${id}"`
    );
  }
  if (id === "." || id === "..") {
    throw new IntentionSchemaError(
      `Node id is a reserved path name: "${id}"`
    );
  }
}

export function writeNode(dir: string, node: IntentionNodeInput): void {
  const validated = validateNode(node);
  assertPathSafeId(validated.id);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${validated.id}.md`);
  const body = readExistingBody(filePath, validated) ?? `# ${validated.statement}\n`;
  assertNoBodyLoss(filePath, validated, body);
  // `stringify` already ends its output with a newline, so the closing fence
  // lands on its own line.
  const content = `---\n${stringify(validated)}---\n${body}`;
  writeFileAtomic(filePath, content);
}

/**
 * Publish `content` at `finalPath` atomically: write a collision-safe temp
 * file in the SAME directory (rename(2) cannot cross filesystems), then
 * rename it over the final path. An interrupted write (SIGKILL, OOM, ENOSPC)
 * can then only ever leave the temp file behind — never a partial or 0-byte
 * `<id>.md` that `listNodes` would choke on. Mirrors the established
 * `> "$f.tmp" && mv "$f.tmp" "$f"` convention already used in bash at
 * dispatch-fleet-alarm's splice_body/refresh_stamp_write and in TypeScript at
 * office-hours-snapshot/src/persist.ts.
 */
function writeFileAtomic(finalPath: string, content: string): void {
  const dir = dirname(finalPath);
  const tmp = join(
    dir,
    `.${basename(finalPath)}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`,
  );
  try {
    writeFileSync(tmp, content);
    renameSync(tmp, finalPath);
  } catch (err) {
    try {
      rmSync(tmp, { force: true });
    } catch {
      // best-effort cleanup; the original error is rethrown below
    }
    throw err;
  }
}

/**
 * Durable-body invariant (tactic-nontactic-body-durability): every node body is
 * authoritative content `writeNode` preserves verbatim across rewrites via
 * `readExistingBody`, for every kind. This guard asserts that invariant held —
 * it throws if a rewrite is about to replace an existing file's non-placeholder
 * body with the regenerated `# ${statement}` placeholder, catching any
 * body-preservation regression before it silently discards authored content. An
 * existing body that is still the generated placeholder carries no authored
 * content, so it may be regenerated freely.
 */
export function assertNoBodyLoss(filePath: string, node: IntentionNode, body: string): void {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  const existing: unknown = parse(extractFrontmatter(raw, node.id));
  if (!isPlainObject(existing)) return;
  const existingBody = extractBody(raw, node.id);
  if (existingBody === `# ${String(existing.statement)}\n`) return;
  if (body !== existingBody) {
    throw new IntentionSchemaError(
      `Refusing to write "${node.id}": the rewrite would replace the existing ` +
        `hand-authored body with regenerated content, discarding durable ` +
        `content. This is a body-preservation regression in writeNode.`
    );
  }
}

/**
 * For a node whose file already exists on disk, read that file's existing body
 * (everything after the closing frontmatter fence) verbatim so a rewrite doesn't
 * clobber durable content. Every node body is authoritative under the
 * durable-body contract (tactic-nontactic-body-durability), so this applies to
 * every kind. Returns `null` when no file exists yet — callers fall back to the
 * generated `# ${statement}` body.
 */
function readExistingBody(filePath: string, node: IntentionNode): string | null {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, "utf8");
  return extractBody(raw, node.id);
}

// `extractFrontmatter` / `extractBody` moved to the pure `frontmatter.ts`
// module (imported above) so the fs-free digest can share one implementation.

/**
 * Parse and validate already-read node text, fs-free. `readNode` delegates to
 * this after its path-safety check and file read; callers that already have
 * raw node text in hand (e.g. from `git show`) can parse it directly without
 * touching disk.
 */
export function parseNodeRaw(raw: string, id: string): IntentionNode {
  return validateNode(parse(extractFrontmatter(raw, id)));
}

/**
 * Read and validate the node stored at `<dir>/<id>.md`.
 *
 * Only the YAML frontmatter (between the first two `---` fences) is authoritative;
 * the markdown body is ignored.
 */
export function readNode(dir: string, id: string): IntentionNode {
  assertPathSafeId(id);
  const raw = readFileSync(join(dir, `${id}.md`), "utf8");
  return parseNodeRaw(raw, id);
}

/**
 * Read the markdown body (everything after the closing frontmatter fence) of
 * the node stored at `<dir>/<id>.md`, verbatim. `readNode` deliberately drops
 * the body (only frontmatter is authoritative on read), but the tactic scope
 * fingerprint (`tacticScopeFingerprint`) hashes the body, so its caller reads
 * it through this helper rather than re-parsing the fence boundary by hand.
 */
export function readNodeBody(dir: string, id: string): string {
  assertPathSafeId(id);
  const raw = readFileSync(join(dir, `${id}.md`), "utf8");
  return extractBody(raw, id);
}

/** One node file that could not be read or validated during enumeration. */
export interface NodeReadFailure {
  id: string;
  error: unknown;
}

/**
 * Enumerate every node, isolating per-file read failures. One malformed file
 * (a 0-byte or partially-written `<id>.md`) costs exactly one node, never the
 * whole directory — the fleet-wide blast radius observed on 2026-08-01.
 *
 * `README.md` is a non-node companion doc kept alongside the node files — it
 * has no frontmatter, so it is excluded from the scan entirely rather than
 * reported as a failure.
 */
export function listNodesResilient(dir: string): {
  nodes: IntentionNode[];
  failures: NodeReadFailure[];
} {
  const nodes: IntentionNode[] = [];
  const failures: NodeReadFailure[] = [];
  const ids = readdirSync(dir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => name.slice(0, -".md".length))
    .sort();
  for (const id of ids) {
    try {
      nodes.push(readNode(dir, id));
    } catch (error) {
      failures.push({ id, error });
    }
  }
  return { nodes, failures };
}

function failureMessage(failure: NodeReadFailure): string {
  return failure.error instanceof Error ? failure.error.message : String(failure.error);
}

/**
 * Read every `*.md` node file in `dir`, validating each, sorted by id for a
 * stable result.
 *
 * Tolerant by contract: a file that cannot be read or validated is skipped
 * with a warning on stderr, so one corrupt node file costs exactly one node
 * rather than crashing every caller that enumerates the store.
 *
 * FOR REPORT AND TELEMETRY CONSUMERS ONLY — census, digest, sensor, view, and
 * render callers, where a missing node degrades a report rather than changing a
 * decision. Every gate, selection, and reconciliation caller MUST use
 * `listNodesStrict` instead: absence from the enumerated set is load-bearing
 * "pass" semantics in those paths (`blockersComplete` in `router.ts` reads an
 * absent `blocked_by` id to mean COMPLETE; `check-node-selection.ts`'s
 * soft-freeze gate `continue`s past a serving strategy missing from its
 * `byId` map), so a silently dropped file would weaken a gate instead of
 * being rejected.
 *
 * `README.md` is a non-node companion doc kept alongside the node files — it
 * has no frontmatter, so it is excluded here.
 */
export function listNodes(dir: string): IntentionNode[] {
  const { nodes, failures } = listNodesResilient(dir);
  for (const failure of failures) {
    process.stderr.write(
      `warning: skipping unreadable node file ${failure.id}.md: ${failureMessage(failure)}\n`
    );
  }
  return nodes;
}

/**
 * Strict enumeration: throw `IntentionSchemaError` naming EVERY unreadable
 * file. For integrity gates (validate-graph) where silently skipping a
 * corrupt tracked node would turn a required CI check into a false pass.
 * Every failing file is reported, so one run surfaces all corruption rather
 * than only the first file.
 */
export function listNodesStrict(dir: string): IntentionNode[] {
  const { nodes, failures } = listNodesResilient(dir);
  if (failures.length > 0) {
    const detail = failures.map((f) => `  ${f.id}.md: ${failureMessage(f)}`).join("\n");
    throw new IntentionSchemaError(
      `${failures.length} unreadable node file(s) in "${dir}":\n${detail}`
    );
  }
  return nodes;
}

