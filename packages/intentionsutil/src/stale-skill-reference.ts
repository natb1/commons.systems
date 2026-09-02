/**
 * stale-skill-reference: the pure detection rule behind the
 * `stale-skill-reference` check (unit 7, `tactic-migration-frontier-projection`)
 * — the companion to `dangling-tooling-path.ts`.
 *
 * CANDIDATE UNIVERSE IS BOUNDED TO KNOWN SKILL NAMES, deliberately, rather than
 * a generic `/word` regex over all prose. A generic slash-token scan would
 * false-positive on the many bare absolute-path mentions this very rules
 * corpus contains (`/tmp`, `/dev/null`, `/etc/claude-code/...`) — none of
 * which is a skill citation. Restricting the search to names that this repo's
 * `.claude/skills/` directory has ACTUALLY carried at some point in its
 * history (the `retiredSkillNames` set the check builds from git history)
 * removes that false-positive class entirely: a name never once used as a
 * skill directory can never appear in `retiredSkillNames`, so `/tmp` or
 * `/etc` can never be tested against.
 *
 * PURE. Same seam as `dangling-tooling-path.ts`: this module takes already-read
 * file contents and a caller-supplied set of retired names; the git-history
 * walk and current-directory listing live at the check's `run()` call site.
 */

export interface ScannedFile {
  path: string;
  content: string;
}

export interface FrontierSeed {
  subject: string;
  detail: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Every retired skill name (from `retiredSkillNames`) that `content` cites as
 * `/<name>`, word-bounded so a name that is a prefix of a longer word is not
 * mistaken for a citation (`/align` does not match inside `/align-tactics`).
 */
export function citedRetiredSkills(
  content: string,
  retiredSkillNames: ReadonlySet<string>,
): string[] {
  const hits: string[] = [];
  for (const name of retiredSkillNames) {
    const pattern = new RegExp(`/${escapeRegExp(name)}(?![A-Za-z0-9_-])`);
    if (pattern.test(content)) hits.push(name);
  }
  return hits.sort();
}

/**
 * The check's whole rule: one seed per `(file, retired skill name)` pair found
 * across `files`. Sorted for a deterministic report.
 */
export function staleSkillReferences(
  files: readonly ScannedFile[],
  retiredSkillNames: ReadonlySet<string>,
): FrontierSeed[] {
  const seeds: FrontierSeed[] = [];
  for (const file of files) {
    for (const name of citedRetiredSkills(file.content, retiredSkillNames)) {
      seeds.push({
        subject: `${file.path} (cites /${name})`,
        detail: `cites retired skill /${name} — .claude/skills/${name}/ is absent from disk`,
      });
    }
  }
  seeds.sort((a, b) => (a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0));
  return seeds;
}
