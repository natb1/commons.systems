/**
 * dangling-tooling-path: the pure token-extraction and orphan-detection rule
 * behind the `dangling-tooling-path` check (unit 7,
 * `tactic-migration-frontier-projection`) — "a migration whose target is
 * absence."
 *
 * REUSES `lint-verify-fence-paths.sh`'s TOKEN RULE VERBATIM
 * (`.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh`):
 * a candidate token, after stripping surrounding quote/backtick punctuation
 * and trailing separators, must contain `/`, must contain none of
 * `$ * ? { } ( )`, and must not be a URL (`://`). A trailing `:<line>` or
 * `:<line>-<line>` anchor is stripped before the existence test.
 *
 * SCOPE DIFFERS FROM THAT SCRIPT ON PURPOSE. `lint-verify-fence-paths.sh`
 * scans only ` ```verify ` fences and accepts any repo top-level entry as a
 * candidate's leading segment. This check scans `.claude/**` prose and
 * non-`done` intention node bodies WHOLESALE (not fence-scoped), and narrows
 * candidates to the four TOOLING ROOTS below — the check's own migration
 * target, not the general path-orphan problem `lint-verify-fence-paths.sh`
 * already owns.
 *
 * ORPHAN vs FORWARD REFERENCE, same rule: a token that does not exist on disk
 * is reported only if git history shows it once existed. A plan may
 * legitimately name a script its own unit will create — that is a forward
 * reference, not a miss.
 *
 * PURE. This module takes already-read file contents and two caller-supplied
 * predicates (`exists`, `everExisted`) rather than touching fs or git itself —
 * exactly the seam `checks.ts`'s `HighWaterSource` uses for the identical
 * reason: the rule is unit-testable with fakes, and the real fs/git wiring
 * lives at the check's `run()` call site in `check-registrations.ts`.
 */

/** The check's migration target: token candidates outside these roots are ignored. */
export const TOOLING_ROOTS: readonly string[] = [
  "packages/intentionsutil/scripts/",
  ".claude/skills/",
  ".claude/hooks/",
  ".github/scripts/",
];

const FORBIDDEN_CHARS = ["$", "*", "?", "{", "}", "(", ")"];
const LINE_ANCHOR = /^(.*):\d+(-\d+)?$/;

/**
 * Every candidate path-like token in `content`, split whitespace-wise per
 * line, with `lint-verify-fence-paths.sh`'s exact punctuation-stripping and
 * shape rule applied. Order-preserving; may contain duplicates (the caller
 * dedupes per `(file, path)` pair).
 */
export function extractCandidateTokens(content: string): string[] {
  const tokens: string[] = [];
  for (const line of content.split("\n")) {
    for (const raw of line.split(/\s+/)) {
      let token = raw;
      if (token.length === 0) continue;
      while (token.length > 0 && /^["'`]/.test(token)) token = token.slice(1);
      while (token.length > 0 && /["'`,;]$/.test(token)) token = token.slice(0, -1);
      if (token.length === 0) continue;
      if (!token.includes("/")) continue;
      if (token.includes("://")) continue;
      if (FORBIDDEN_CHARS.some((ch) => token.includes(ch))) continue;
      tokens.push(token);
    }
  }
  return tokens;
}

/** Strip a trailing `:<line>` / `:<line>-<line>` anchor, exactly as the shell rule does. */
export function stripLineAnchor(token: string): string {
  const m = token.match(LINE_ANCHOR);
  return m ? m[1] : token;
}

/** A file's repo-relative path and its full text content. */
export interface ScannedFile {
  path: string;
  content: string;
}

export interface FrontierSeed {
  subject: string;
  detail: string;
}

export interface DanglingToolingPathInput {
  files: readonly ScannedFile[];
  /** Does this repo-relative path exist on disk right now? */
  exists: (relPath: string) => boolean;
  /** Does git history show this path (or an ancestor directory of it) ever existed? */
  everExisted: (relPath: string) => boolean;
}

/**
 * The check's whole rule: every tooling-root token named in `input.files`
 * that is absent today but present in git history — an orphan, not a forward
 * reference. Deduplicated per `(file, path)` pair, sorted for a deterministic
 * report.
 */
export function danglingToolingPaths(input: DanglingToolingPathInput): FrontierSeed[] {
  const seen = new Set<string>();
  const seeds: FrontierSeed[] = [];
  for (const file of input.files) {
    for (const raw of extractCandidateTokens(file.content)) {
      if (!TOOLING_ROOTS.some((root) => raw.startsWith(root))) continue;
      const stripped = stripLineAnchor(raw);
      if (stripped.length === 0) continue;
      if (input.exists(stripped)) continue;
      // Forward reference: never existed, so a future unit's own deliverable
      // is not flagged as an orphan.
      if (!input.everExisted(stripped)) continue;
      const key = `${file.path}|${stripped}`;
      if (seen.has(key)) continue;
      seen.add(key);
      seeds.push({
        subject: `${file.path} -> ${stripped}`,
        detail: `names ${stripped}, absent on disk though git history shows it once existed`,
      });
    }
  }
  seeds.sort((a, b) => (a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0));
  return seeds;
}
