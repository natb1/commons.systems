// Pure frontmatter-fence parsing, shared by the fs-backed store (store.ts) and
// the fs-free digest (digest.ts). No fs/git/network here — these operate on
// already-read raw file text so both a reader that opened the file and a reader
// handed the text can locate the fence boundary with one implementation.

import { IntentionSchemaError } from "./errors.js";

/**
 * Extract the text between the opening `---\n` fence and the next line that is
 * exactly `---`. Throws a descriptive error on a missing fence rather than
 * returning a fallback, so a corrupted node file surfaces loudly.
 */
export function extractFrontmatter(raw: string, id: string): string {
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

/**
 * Return everything after the closing frontmatter fence, verbatim (including
 * any trailing newline convention already on disk). Reuses `extractFrontmatter`
 * to locate the fence boundary rather than re-deriving it.
 */
export function extractBody(raw: string, id: string): string {
  const frontmatter = extractFrontmatter(raw, id);
  // `raw` is "---\n" + frontmatter + closing-fence-line + "\n" + body. The
  // closing fence line itself is the first line of what remains after the
  // frontmatter text, so the body starts right after that line's newline.
  const afterFrontmatter = raw.slice("---\n".length + frontmatter.length);
  const newlineIndex = afterFrontmatter.indexOf("\n");
  return newlineIndex === -1 ? "" : afterFrontmatter.slice(newlineIndex + 1);
}
