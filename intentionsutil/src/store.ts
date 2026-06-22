import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { validateNode, type IntentionNode, type IntentionNodeInput } from "./schema.js";
import { IntentionSchemaError } from "./errors.js";

/**
 * Serialize a node to its on-disk form and write it to `<dir>/<id>.md`.
 *
 * The node is validated FIRST (defaults applied) so the written frontmatter is
 * complete and deterministic. The markdown body is a cosmetic render of
 * `statement` and is not parsed back on read.
 */
export function writeNode(dir: string, node: IntentionNodeInput): void {
  const validated = validateNode(node);
  mkdirSync(dir, { recursive: true });
  // `stringify` already ends its output with a newline, so the closing fence
  // lands on its own line.
  const content = `---\n${stringify(validated)}---\n# ${validated.statement}\n`;
  writeFileSync(join(dir, `${validated.id}.md`), content);
}

/**
 * Read and validate the node stored at `<dir>/<id>.md`.
 *
 * Only the YAML frontmatter (between the first two `---` fences) is authoritative;
 * the markdown body is ignored.
 */
export function readNode(dir: string, id: string): IntentionNode {
  const raw = readFileSync(join(dir, `${id}.md`), "utf8");
  return validateNode(parse(extractFrontmatter(raw, id)));
}

/**
 * Read every `*.md` node file in `dir`, validating each, sorted by id for a
 * stable result.
 */
export function listNodes(dir: string): IntentionNode[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
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
