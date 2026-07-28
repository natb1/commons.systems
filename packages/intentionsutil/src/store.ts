import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
function assertPathSafeId(id: string): void {
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
  writeFileSync(filePath, content);
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
 * Read and validate the node stored at `<dir>/<id>.md`.
 *
 * Only the YAML frontmatter (between the first two `---` fences) is authoritative;
 * the markdown body is ignored.
 */
export function readNode(dir: string, id: string): IntentionNode {
  assertPathSafeId(id);
  const raw = readFileSync(join(dir, `${id}.md`), "utf8");
  return validateNode(parse(extractFrontmatter(raw, id)));
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

/**
 * Read every `*.md` node file in `dir`, validating each, sorted by id for a
 * stable result.
 *
 * `README.md` is a non-node companion doc kept alongside the node files — it
 * has no frontmatter, so it is excluded here. Without this, `listNodes` on
 * the real store directory throws on the README's missing fence.
 */
export function listNodes(dir: string): IntentionNode[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => name.slice(0, -".md".length))
    .sort()
    .map((id) => readNode(dir, id));
}

