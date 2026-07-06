import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { validateNode, type IntentionNode, type IntentionNodeInput } from "./schema.js";
import { IntentionSchemaError } from "./errors.js";

/**
 * Serialize a node to its on-disk form and write it to `<dir>/<id>.md`.
 *
 * The node is validated FIRST (defaults applied) so the written frontmatter is
 * complete and deterministic. For every kind except `tactic`, the markdown
 * body is a cosmetic render of `statement` and is not parsed back on read.
 *
 * `tactic` bodies are authoritative, hand-maintained plan content (see
 * strategy-graph-native-dispatch's doctrine amendment): if `<dir>/<id>.md`
 * already exists, its existing body is preserved verbatim across the
 * rewrite rather than regenerated. A brand-new tactic file (no prior file on
 * disk) still gets the generated `# ${statement}` placeholder body.
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
  const body = readExistingTacticBody(filePath, validated) ?? `# ${validated.statement}\n`;
  // `stringify` already ends its output with a newline, so the closing fence
  // lands on its own line.
  const content = `---\n${stringify(validated)}---\n${body}`;
  writeFileSync(filePath, content);
}

/**
 * For a `tactic` node whose file already exists on disk, read that file's
 * existing body (everything after the closing frontmatter fence) verbatim so
 * a rewrite doesn't clobber hand-maintained plan content. Returns `null` for
 * any other kind, or for a tactic with no existing file yet — callers fall
 * back to the generated `# ${statement}` body in both cases.
 */
function readExistingTacticBody(filePath: string, node: IntentionNode): string | null {
  if (node.kind !== "tactic" || !existsSync(filePath)) return null;
  const raw = readFileSync(filePath, "utf8");
  return extractBody(raw, node.id);
}

/**
 * Return everything after the closing frontmatter fence, verbatim (including
 * any trailing newline convention already on disk). Reuses `extractFrontmatter`
 * to locate the fence boundary rather than re-deriving it.
 */
function extractBody(raw: string, id: string): string {
  const frontmatter = extractFrontmatter(raw, id);
  // `raw` is "---\n" + frontmatter + closing-fence-line + "\n" + body. The
  // closing fence line itself is the first line of what remains after the
  // frontmatter text, so the body starts right after that line's newline.
  const afterFrontmatter = raw.slice("---\n".length + frontmatter.length);
  const newlineIndex = afterFrontmatter.indexOf("\n");
  return newlineIndex === -1 ? "" : afterFrontmatter.slice(newlineIndex + 1);
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
  return validateNode(parse(extractFrontmatter(raw, id)));
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

/**
 * Extract the text between the opening `---\n` fence and the next line that is
 * exactly `---`.
 */
function extractFrontmatter(raw: string, id: string): string {
  if (!raw.startsWith("---\n")) {
    throw new IntentionSchemaError(`Node ${id} is missing an opening "---" frontmatter fence`);
  }
  const body = raw.slice("---\n".length);
  // The closing fence is a line that is exactly "---".
  const closeIndex = body.search(/^---$/m);
  if (closeIndex === -1) {
    throw new IntentionSchemaError(`Node ${id} is missing a closing "---" frontmatter fence`);
  }
  return body.slice(0, closeIndex);
}
