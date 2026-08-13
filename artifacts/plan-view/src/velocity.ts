import { execFileSync } from "node:child_process";
import type { Velocity } from "./model.js";

/** Trailing window, in days. Matches the token-economy sensor's window. */
export const VELOCITY_WINDOW_DAYS = 28;

/**
 * Claude-eligible tactic flow over a trailing window, derived from the local
 * clone's `intentions/` git history.
 *
 * The counting heuristic is the one already in service in
 * `packages/intentionsutil/scripts/read-sensors.ts` (`readTacticVelocity`,
 * the velocity half of the token-economy sensor):
 *
 *  - CREATED = a commit adding an `intentions/tactic-*.md` whose frontmatter
 *    declares `owner: ai`. Drafts count — they are claude-eligible work
 *    entering the graph.
 *  - CLOSED = a commit setting such a node's `phase` to `done`, or deleting the
 *    file (gated on the removed `owner: ai` line). The phase-transition diff
 *    line carries no ownership context, so that half re-reads the file at that
 *    commit and checks it declares `owner: ai` — otherwise a human-owned tactic
 *    that also carries a dispatch phase inflates claude-eligible closure
 *    velocity.
 *
 * Reimplemented here rather than imported: `read-sensors.ts` is a SCRIPT whose
 * job is to write sensor readings, and it returns this as a formatted display
 * string (`"<c> created / <d> closed (net <±n>)"`) rather than a rate. The
 * artifact needs the number. Consolidating both callers onto one exported
 * helper in `packages/intentionsutil/src` is the right follow-up and is
 * recorded on `tactic-plan-view-table`; it is deliberately not done in the same
 * change as the first artifact, because moving a live sensor's arithmetic and
 * standing up a new delivery substrate are separate risks.
 *
 * Unlike the sensor, a git failure is NOT degraded to "unknown" here: this repo
 * prefers a clear error over a fallback, and a velocity that silently reads
 * zero would render every ETA on the page as `unavailable` while looking like a
 * paused queue rather than a broken build.
 */
export function readVelocity(repoDir: string, windowDays = VELOCITY_WINDOW_DAYS): Velocity {
  const patch = execFileSync(
    "git",
    [
      "log",
      `--since=${windowDays} days ago`,
      "--diff-filter=AMD",
      "--no-renames",
      "--format=%H",
      "-p",
      "--",
      "intentions/tactic-*.md",
    ],
    {
      cwd: repoDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );

  const aiOwnedAt = new Map<string, boolean>();
  const isAiOwnedAt = (commit: string, path: string): boolean => {
    const key = `${commit}:${path}`;
    const memo = aiOwnedAt.get(key);
    if (memo !== undefined) return memo;
    let owned = false;
    try {
      const content = execFileSync("git", ["show", key], {
        cwd: repoDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      owned = /^owner:\s*ai\s*$/m.test(content);
    } catch {
      // A path unresolvable at that commit is not evidence of ai ownership.
      owned = false;
    }
    aiOwnedAt.set(key, owned);
    return owned;
  };

  const created = new Set<string>();
  const closed = new Set<string>();
  let commit: string | null = null;
  let path: string | null = null;
  let isNewFile = false;
  let isDeletedFile = false;

  for (const line of patch.split("\n")) {
    if (/^[0-9a-f]{40}$/.test(line)) {
      commit = line;
      continue;
    }
    const header = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
    if (header !== null) {
      path = header[2];
      isNewFile = false;
      isDeletedFile = false;
      continue;
    }
    if (path === null) continue;
    if (line.startsWith("new file mode")) {
      isNewFile = true;
      continue;
    }
    if (line.startsWith("deleted file mode")) {
      isDeletedFile = true;
      continue;
    }
    if (isNewFile && /^\+owner:\s*ai\s*$/.test(line)) {
      created.add(path);
      continue;
    }
    if (isDeletedFile && /^-owner:\s*ai\s*$/.test(line)) {
      closed.add(path);
      continue;
    }
    if (
      !isDeletedFile &&
      commit !== null &&
      /^\+\s*phase:\s*done\s*$/.test(line) &&
      isAiOwnedAt(commit, path)
    ) {
      closed.add(path);
    }
  }

  return {
    perDay: closed.size / windowDays,
    windowDays,
    closures: closed.size,
    created: created.size,
  };
}
