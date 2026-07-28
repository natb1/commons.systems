// Script-layer helper: read the intention store as it exists at a git ref
// rather than in the local working tree.
//
// Kept OUT of `src/` deliberately, for the same reason as
// `lib-deleted-node-ids.ts`: it shells out to git, and the `src/` modules stay
// pure (no fs/git/network) so they can be exercised on in-memory inputs.
//
// Why it exists: a script that reads `intentions/` from its own checkout
// answers from whatever that worktree last synced. A stale worktree therefore
// reports stale park state, stale phases, stale attention — silently, with no
// signal that the answer is old. Callers that must answer about *current*
// graph state read at `origin/main` through this helper instead.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listNodes } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";

/**
 * Every node in the `intentions/` store as of `ref`, validated and sorted by id
 * — the git-ref-aware counterpart of `listNodes(<worktree>/intentions)`.
 *
 * `repoRoot` is a parameter (not resolved from `import.meta.url`) because
 * callers already know which checkout they mean, and the answer must not depend
 * on where this file happens to live.
 *
 * Failure posture (see .claude/rules/code-style.md): a missing store at `ref`
 * throws a descriptive error rather than returning an empty list — an empty
 * graph is indistinguishable from "nothing is parked" and would be read as a
 * real answer. A schema-invalid node likewise propagates its
 * `IntentionSchemaError` uncaught: a malformed node at `origin/main` is a
 * repo-integrity failure, not something to swallow.
 *
 * Implementation note: `git archive <ref> intentions` and the `tar -x` that
 * unpacks it are run as two separately status-checked `execFileSync` calls, not
 * as a shell pipeline. Without `pipefail`, a failing `git archive` still exits 0
 * through `tar`, which extracts the empty stream happily — yielding a silently
 * empty store, exactly the failure mode this helper exists to prevent.
 */
export function listNodesAtRef(repoRoot: string, ref: string): IntentionNode[] {
  // Precheck: does `ref` have an `intentions/` tree at all? Mirrors
  // `.claude/skills/dispatch-propagate/scripts/graph-select-target` (the
  // `git cat-file -e origin/main:intentions` guard). Cheap, and it turns an
  // unfetched/mistyped ref into a clear error before the archive step.
  try {
    execFileSync("git", ["-C", repoRoot, "cat-file", "-e", `${ref}:intentions`], {
      stdio: "ignore",
    });
  } catch {
    throw new Error(
      `listNodesAtRef: no \`intentions\` tree at ref "${ref}" in the repository at ` +
        `${repoRoot}. If "${ref}" is a remote-tracking ref, the local copy may be missing ` +
        `or stale — run \`git fetch origin main\` and retry, or pass a ref that exists ` +
        `in this repository.`,
    );
  }

  // Capture the archive as a Buffer (no `encoding`): it is binary tar, and
  // decoding it as text would corrupt the node contents.
  const tar = execFileSync("git", ["-C", repoRoot, "archive", ref, "intentions"], {
    maxBuffer: 64 * 1024 * 1024,
  });

  const dir = mkdtempSync(join(tmpdir(), "intentions-at-ref-"));
  try {
    execFileSync("tar", ["-x", "-C", dir], { input: tar });
    return listNodes(join(dir, "intentions"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
