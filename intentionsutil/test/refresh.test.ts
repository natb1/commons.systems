import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

import { execFileSync } from "node:child_process";
import { resolveLinkedPrs } from "../scripts/refresh.js";

const mockExec = vi.mocked(execFileSync);

// Build an Error shaped like execFileSync's throw (strings because encoding:utf8).
function ghError(stderr: string): Error {
  return Object.assign(new Error("Command failed"), { stderr, stdout: "", status: 1 });
}

beforeEach(() => {
  mockExec.mockReset();
});

// Drive the two gh calls resolveLinkedPrs makes: stage 1 (gh api) returns an
// empty pages array; stage 2 (gh issue view) throws the supplied error so we
// can assert swallow-vs-rethrow behavior.
function driveStage2Throw(err: Error): void {
  mockExec
    .mockReturnValueOnce(JSON.stringify([[]])) // stage 1: gh api → empty pages
    .mockImplementationOnce(() => { throw err; }); // stage 2: gh issue view → throws
}

describe("resolveLinkedPrs stage-2 catch", () => {
  it("swallows the deleted/transferred (Could not resolve) error and returns the stage-1 result", () => {
    driveStage2Throw(
      ghError(
        "GraphQL: Could not resolve to an issue or pull request with the number of 123. (repository.issue)",
      ),
    );
    expect(resolveLinkedPrs(123)).toEqual([]);
  });

  it("re-throws a rate-limit (429) error instead of swallowing it", () => {
    driveStage2Throw(ghError("gh: API rate limit (HTTP 429)"));
    expect(() => resolveLinkedPrs(123)).toThrow();
  });

  it("re-throws an auth failure (403) instead of swallowing it", () => {
    driveStage2Throw(ghError("gh: HTTP 403 Forbidden"));
    expect(() => resolveLinkedPrs(123)).toThrow();
  });
});

// Drive the two gh calls with successful (non-throwing) returns: stage 1 (gh
// api --slurp) returns the supplied pages of PRs; stage 2 (gh issue view)
// returns the supplied closing-references view.
function driveBothSucceed(
  pages: { number: number; state: "open" | "closed"; merged_at: string | null; ref: string }[][],
  closingRefs: { number: number; state: "OPEN" | "CLOSED" | "MERGED" }[],
): void {
  const slurped = pages.map((page) =>
    page.map((pr) => ({
      number: pr.number,
      state: pr.state,
      merged_at: pr.merged_at,
      head: { ref: pr.ref },
    })),
  );
  mockExec
    .mockReturnValueOnce(JSON.stringify(slurped)) // stage 1: gh api → pages
    .mockReturnValueOnce(
      JSON.stringify({ closedByPullRequestsReferences: closingRefs }),
    ); // stage 2: gh issue view → closing references
}

describe("resolveLinkedPrs merge/dedup", () => {
  it("stage 1 wins on a number conflict: its state is kept over stage 2's", () => {
    // Both stages report PR #500, but with different states. Stage 1's
    // merged_at-derived state ("merged") must win over stage 2's "OPEN".
    driveBothSucceed(
      [[{ number: 500, state: "closed", merged_at: "2026-06-01T00:00:00Z", ref: "123-feature" }]],
      [{ number: 500, state: "OPEN" }],
    );
    expect(resolveLinkedPrs(123)).toEqual([{ number: 500, state: "merged" }]);
  });

  it("adds a stage-2 PR that stage 1 did not see (additive path)", () => {
    // Stage 1 finds the open in-progress PR #501 (branch-prefix match); stage 2
    // contributes a separate closing reference #502 not present in stage 1.
    driveBothSucceed(
      [[{ number: 501, state: "open", merged_at: null, ref: "123-wip" }]],
      [{ number: 502, state: "MERGED" }],
    );
    expect(resolveLinkedPrs(123)).toEqual([
      { number: 501, state: "open" },
      { number: 502, state: "merged" },
    ]);
  });
});
