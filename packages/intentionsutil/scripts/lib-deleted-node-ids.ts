// Script-layer helper shared by `graph-digest.ts` and `validate-graph.ts`.
//
// Kept OUT of `src/` deliberately: it shells out to git, and the digest module
// (`src/digest.ts`) must stay pure (no fs/git/network) so it can be exercised on
// plain in-memory inputs. Both CLI scripts that gather the digest/validate
// inputs need the deleted-id set, so it lives here as one shared implementation
// rather than being copied into each script.

import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at `packages/intentionsutil/scripts/lib-deleted-node-ids.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

/**
 * Ids whose `intentions/<id>.md` was deleted at any point in git history — used
 * to classify a prose/DANGLING-REFS reference as `pruned` rather than
 * `missing`. Shelled here (the digest module stays pure); a git failure
 * surfaces as a clear error rather than a silent empty list (see
 * .claude/rules/code-style.md).
 *
 * `--no-renames` disables git's rename detection so an id migration (e.g. the
 * repo's `issue-N` -> `tactic-N` rename) reports the old path as a plain delete
 * — otherwise git classifies it as a rename (R), the `--diff-filter=D` filter
 * drops it, and a lingering reference to the old id is misclassified `missing`
 * instead of `pruned`. It also makes the result independent of git's
 * similarity heuristic, matching the module's determinism guarantee.
 */
export function deletedNodeIds(repoRootOverride?: string): string[] {
  // `repoRootOverride` exists so the shallow guard below can be exercised
  // against a scratch clone; production callers pass nothing and get the
  // module-resolved repo root exactly as before.
  const root = repoRootOverride ?? repoRoot;

  // A SHALLOW clone silently defeats this helper's whole contract. `git log`
  // still succeeds and still exits 0 — it just cannot see past the graft point,
  // so every node pruned before the cutoff is missing from the result. Callers
  // then classify live prose references to those nodes as `missing`, and
  // validate-graph reports a detailed, plausible, entirely fabricated list of
  // violations naming real nodes. That is strictly worse than an error: the
  // natural reading is "main is broken" rather than "my clone is truncated".
  //
  // Observed 2026-07-23: a clone grafted at 2026-07-18 returned 37 ids instead
  // of 240, producing 15 false prose-reference violations for a tree CI
  // validated clean at the same commit.
  //
  // There is no partial-credit answer here — a truncated deletion set cannot be
  // distinguished from a complete one by inspection — so fail loud rather than
  // proceeding with it (.claude/rules/code-style.md).
  const shallow = execFileSync("git", ["-C", root, "rev-parse", "--is-shallow-repository"], {
    encoding: "utf8",
  }).trim();
  if (shallow === "true") {
    throw new Error(
      `deletedNodeIds: the repository at ${root} is a SHALLOW clone, so its deletion ` +
        `history is truncated. Every node pruned before the graft point would be reported as ` +
        `an unresolved prose reference. Run \`git fetch --unshallow\` and retry.`,
    );
  }

  const out = execFileSync(
    "git",
    ["-C", root, "log", "--diff-filter=D", "--no-renames", "--name-only", "--pretty=format:", "--", "intentions/"],
    { encoding: "utf8" },
  );
  const ids = new Set<string>();
  for (const line of out.split("\n")) {
    const m = line.match(/^intentions\/(.+)\.md$/);
    if (m) ids.add(m[1]);
  }
  return [...ids];
}
