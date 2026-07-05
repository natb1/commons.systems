import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { isPlainObject, validateNode, type IntentionNode, type IntentionNodeInput } from "./schema.js";
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
function assertPathSafeId(id: string): void {
  if (id.includes("/") || id.includes("\\") || id.includes("..")) {
    throw new IntentionSchemaError(
      `Node id contains path separators or traversal sequences: "${id}"`
    );
  }
}

export function writeNode(dir: string, node: IntentionNodeInput): void {
  const validated = validateNode(node);
  assertPathSafeId(validated.id);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${validated.id}.md`);
  assertNoTacticBodyLoss(filePath, validated);
  const body = readExistingTacticBody(filePath, validated) ?? `# ${validated.statement}\n`;
  // `stringify` already ends its output with a newline, so the closing fence
  // lands on its own line.
  const content = `---\n${stringify(validated)}---\n${body}`;
  writeFileSync(filePath, content);
}

/**
 * Guard against silent plan loss on a kind change: rewriting an existing
 * `tactic` file with `kind` changed away from `tactic` would fall through to
 * the regenerated `# ${statement}` placeholder body and discard the
 * hand-authored plan content that tactic bodies authoritatively carry. Throw a
 * clear error instead — a deliberate reclassification requires deleting or
 * rewriting the file explicitly. A tactic whose body is still the generated
 * placeholder carries no plan content, so its kind may change freely.
 */
function assertNoTacticBodyLoss(filePath: string, node: IntentionNode): void {
  if (node.kind === "tactic" || !existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  const existing: unknown = parse(extractFrontmatter(raw, node.id));
  if (!isPlainObject(existing) || existing.kind !== "tactic") return;
  const body = extractBody(raw, node.id);
  if (body === `# ${String(existing.statement)}\n`) return;
  throw new IntentionSchemaError(
    `Refusing to change kind of "${node.id}" from "tactic" to "${node.kind}": ` +
      `the rewrite would discard the existing hand-authored tactic body. ` +
      `Delete or rewrite ${filePath} explicitly to reclassify.`
  );
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
