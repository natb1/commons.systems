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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listNodesStrict, readNode } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";

/**
 * Every node in the `intentions/` store as of `ref`, validated and sorted by id
 * — the git-ref-aware counterpart of `listNodesStrict(<worktree>/intentions)`.
 *
 * `repoRoot` is a parameter (not resolved from `import.meta.url`) because
 * callers already know which checkout they mean, and the answer must not depend
 * on where this file happens to live.
 *
 * Failure posture (see .claude/rules/code-style.md): a missing store at `ref`
 * throws a descriptive error rather than returning an empty list — an empty
 * graph is indistinguishable from "nothing is parked" and would be read as a
 * real answer. Enumeration is STRICT for the same reason: this helper serves
 * gate and selection callers, where absence from the enumerated set carries
 * load-bearing "pass" semantics (`blockersComplete` reads an absent
 * `blocked_by` id as complete). It therefore calls `listNodesStrict`, not the
 * tolerant `listNodes` — a file that cannot be read or validated at `ref`
 * propagates its `IntentionSchemaError` uncaught instead of being silently
 * skipped. A malformed node at `origin/main` is a repo-integrity failure, not
 * something to swallow.
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
    return listNodesStrict(join(dir, "intentions"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * ONE node as of `ref` — `readNode(<worktree>/intentions, id)`'s git-ref-aware
 * counterpart — or `null` when the node does not exist at `ref`.
 *
 * `repoRoot` is a parameter for the same reason as `listNodesAtRef`'s: the
 * answer must describe the checkout the CALLER means, never the one this file
 * happens to live in.
 *
 * Deliberately NOT built on `listNodesAtRef`: that helper is STRICT over the
 * whole 500+ node store, so a single unrelated malformed node would fail the
 * verification of a perfectly healthy one. A single-node question must be
 * answerable from a single node file.
 *
 * Failure posture (see .claude/rules/code-style.md):
 * - Absent at `ref` → `null`. That is a real answer, not an error: a pruned or
 *   not-yet-landed node is exactly what a post-land verification asks about.
 * - Anything else (unknown ref, git failure, unparseable/invalid frontmatter)
 *   → throws with a message naming the id, the ref and the repo. Never
 *   collapse an error into `null`, which callers read as "definitely absent".
 */
export function readNodeAtRef(repoRoot: string, ref: string, id: string): IntentionNode | null {
  const path = `${ref}:intentions/${id}.md`;

  // Existence probe first, so "absent at ref" is distinguished from "git blew
  // up" — `git show` reports both as a non-zero exit.
  try {
    execFileSync("git", ["-C", repoRoot, "cat-file", "-e", path], { stdio: "ignore" });
  } catch {
    // Absent path, or a ref that does not resolve at all. Only the former is a
    // legitimate `null`; check the ref separately so a mistyped/unfetched ref
    // is not silently reported as a pruned node.
    try {
      execFileSync("git", ["-C", repoRoot, "rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
        stdio: "ignore",
      });
    } catch {
      throw new Error(
        `readNodeAtRef: ref "${ref}" does not resolve in the repository at ${repoRoot}. ` +
          `If it is a remote-tracking ref, the local copy may be missing or stale — run ` +
          `\`git fetch origin main\` and retry.`,
      );
    }
    return null;
  }

  let content: string;
  try {
    content = execFileSync("git", ["-C", repoRoot, "show", path], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (err) {
    throw new Error(
      `readNodeAtRef: could not read "${path}" in the repository at ${repoRoot}: ${String(err)}`,
    );
  }

  // Parse through the canonical reader (`readNode`) rather than scraping the
  // frontmatter here: one parser, one validation, one set of defaults.
  const dir = mkdtempSync(join(tmpdir(), "intention-at-ref-"));
  try {
    const intentionsDir = join(dir, "intentions");
    mkdirSync(intentionsDir);
    writeFileSync(join(intentionsDir, `${id}.md`), content, "utf8");
    try {
      return readNode(intentionsDir, id);
    } catch (err) {
      throw new Error(
        `readNodeAtRef: "${path}" in the repository at ${repoRoot} is not a valid intention ` +
          `node: ${String(err)}`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
