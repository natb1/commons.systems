/**
 * Shared `gh` CLI utilities for intentionsutil scripts.
 *
 * Exports a plain `gh` runner and a `paginateGhApi` helper that abstracts the
 * `--paginate --slurp` + `JSON.parse` + `.flat()` idiom used by multiple call
 * sites. Callers that need retry logic can inject a custom runner via the
 * `runner` parameter.
 */

import { execFileSync } from "node:child_process";

/** Run a `gh` subcommand and return stdout. Throws on non-zero exit. */
export function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 });
}

/**
 * Call a GitHub REST endpoint with `--paginate --slurp` and return all items
 * as a flat array.
 *
 * `--paginate --slurp` returns a single JSON array-of-arrays (one inner array
 * per page); this helper flattens it. This is robust regardless of page count.
 *
 * The `runner` parameter lets a caller inject a retrying runner (e.g.
 * `ghWithRetry` from backfill.ts); the default is the plain `gh` runner.
 *
 * Pass only the endpoint args (e.g. `["/repos/{owner}/{repo}/pulls?…"]`);
 * the helper prepends `["api", "--paginate", "--slurp"]`.
 */
export function paginateGhApi<T>(
  args: string[],
  runner: (args: string[]) => string = gh,
): T[] {
  if (args.length === 0) {
    throw new Error("paginateGhApi: args must not be empty (no endpoint specified)");
  }
  const out = runner(["api", "--paginate", "--slurp", ...args]);
  const pages: T[][] = JSON.parse(out);
  return pages.flat();
}
