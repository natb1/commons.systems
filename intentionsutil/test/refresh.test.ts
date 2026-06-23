import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

import { execFileSync } from "node:child_process";
import { fetchAllPulls, resolveLinkedPrs } from "../scripts/refresh.js";
import { validateTracker, type ExecutionTracker } from "../src/tracker.js";

const mockExec = vi.mocked(execFileSync);

// Build an Error shaped like execFileSync's throw (strings because encoding:utf8).
function ghError(stderr: string, stdout = ""): Error {
  const e = Object.assign(new Error("Command failed"), {
    stderr,
    stdout,
    status: 1, // gh exits 1 regardless of HTTP status
  });
  return e;
}

beforeEach(() => {
  mockExec.mockReset();
});

describe("fetchAllPulls", () => {
  it("flattens paginated pages and issues exactly one pulls API call", () => {
    const page1Pull = { number: 1, state: "open" as const, merged_at: null, head: { ref: "1-foo" } };
    const page2Pull = { number: 2, state: "closed" as const, merged_at: "2026-01-01T00:00:00Z", head: { ref: "2-bar" } };
    mockExec.mockReturnValueOnce(JSON.stringify([[page1Pull], [page2Pull]]));

    const result = fetchAllPulls();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(page1Pull);
    expect(result[1]).toEqual(page2Pull);
    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(mockExec).toHaveBeenCalledWith(
      "gh",
      ["api", "--paginate", "--slurp", "/repos/{owner}/{repo}/pulls?state=all&per_page=100"],
      expect.anything(),
    );
  });
});

// Drive the stage-2 gh issue view call resolveLinkedPrs makes: throws the
// supplied error so we can assert swallow-vs-rethrow behavior. No stage-1
// mock is needed — resolveLinkedPrs no longer calls gh api internally.
function driveStage2Throw(err: Error): void {
  mockExec.mockImplementationOnce(() => { throw err; }); // stage 2: gh issue view → throws
}

describe("resolveLinkedPrs stage-2 catch", () => {
  it("swallows the deleted/transferred (Could not resolve) error and returns the stage-1 result", () => {
    driveStage2Throw(
      ghError(
        "GraphQL: Could not resolve to an issue or pull request with the number of 123. (repository.issue)",
      ),
    );
    expect(resolveLinkedPrs(123, [])).toEqual([]);
  });

  it("re-throws a rate-limit (429) error instead of swallowing it", () => {
    driveStage2Throw(ghError("gh: API rate limit (HTTP 429)"));
    expect(() => resolveLinkedPrs(123, [])).toThrow();
  });

  it("re-throws an auth failure (403) instead of swallowing it", () => {
    driveStage2Throw(ghError("gh: HTTP 403 Forbidden"));
    expect(() => resolveLinkedPrs(123, [])).toThrow();
  });
});

describe("resolveLinkedPrs merge/dedup (additive)", () => {
  it("stage 1 wins on a number conflict: its state is kept over stage 2's", () => {
    const allPulls = [{ number: 500, state: "closed" as const, merged_at: "2026-06-01T00:00:00Z", head: { ref: "123-feature" } }];
    mockExec.mockReturnValueOnce(JSON.stringify({ closedByPullRequestsReferences: [{ number: 500 }] }));
    expect(resolveLinkedPrs(123, allPulls)).toEqual([{ number: 500, state: "merged" }]);
  });

  it("adds a stage-2 PR that stage 1 did not see (additive path)", () => {
    const allPulls = [
      { number: 501, state: "open" as const, merged_at: null, head: { ref: "123-wip" } },
      { number: 502, state: "closed" as const, merged_at: "2026-06-02T00:00:00Z", head: { ref: "renamed-502" } },
    ];
    mockExec.mockReturnValueOnce(JSON.stringify({ closedByPullRequestsReferences: [{ number: 502 }] }));
    expect(resolveLinkedPrs(123, allPulls)).toEqual([
      { number: 501, state: "open" },
      { number: 502, state: "merged" },
    ]);
  });
});

describe("resolveLinkedPrs", () => {
  it("issues zero gh api pulls calls — only the stage-2 issue-view call", () => {
    const prebuiltPulls = [
      { number: 2414, state: "open" as const, merged_at: null, head: { ref: "2414-feature" } },
    ];
    mockExec.mockReturnValueOnce(JSON.stringify({ closedByPullRequestsReferences: [] }));

    resolveLinkedPrs(2414, prebuiltPulls);

    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(mockExec).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["issue", "view"]),
      expect.anything(),
    );
  });

  it("core regression — stage-2-only closing ref has defined state (not undefined)", () => {
    // PR 900: head ref "renamed-branch" does NOT start with "2414-" so stage 1
    // skips it. Stage 2 (closedByPullRequestsReferences) adds it. Its state
    // must be resolved from the pulls list (merged_at set → "merged").
    const allPulls = [
      { number: 900, state: "closed" as const, merged_at: "2026-01-01T00:00:00Z", head: { ref: "renamed-branch" } },
    ];
    mockExec.mockReturnValueOnce(
      JSON.stringify({ closedByPullRequestsReferences: [{ number: 900 }] }),
    );

    const result = resolveLinkedPrs(2414, allPulls);

    const pr900Entries = result.filter((p) => p.number === 900);
    expect(pr900Entries).toHaveLength(1);
    const pr900 = pr900Entries[0];
    expect(pr900.state).not.toBeUndefined();
    expect(pr900.state).toBe("merged");
  });

  it("validateTracker round-trip — record with resolveLinkedPrs result passes validation after JSON round-trip", () => {
    // This reproduces the old failure mode: JSON.stringify dropped undefined state keys,
    // causing validateTracker to reject the re-parsed record.
    const allPulls = [
      { number: 900, state: "closed" as const, merged_at: "2026-01-01T00:00:00Z", head: { ref: "renamed-branch" } },
    ];
    mockExec.mockReturnValueOnce(
      JSON.stringify({ closedByPullRequestsReferences: [{ number: 900 }] }),
    );

    const linkedPrs = resolveLinkedPrs(2414, allPulls);

    const record: ExecutionTracker = {
      node_id: "test-node",
      issue_number: 2414,
      state: "open",
      linked_prs: linkedPrs,
      dispatch_labels: ["dispatch:planned"],
      refreshed_at: new Date().toISOString(),
    };

    // Direct validation must pass.
    expect(() => validateTracker(record)).not.toThrow();

    // JSON round-trip must also pass (reproduces the original undefined-key bug).
    expect(() => validateTracker(JSON.parse(JSON.stringify(record)))).not.toThrow();
  });

  describe("merge/dedup behavior", () => {
    it("stage-1 branch-prefix filter: only includes PRs whose head branch starts with the issue number", () => {
      const pulls = [
        { number: 10, state: "open" as const, merged_at: null, head: { ref: "2414-feature" } },
        { number: 11, state: "open" as const, merged_at: null, head: { ref: "9999-other" } },
      ];
      mockExec.mockReturnValueOnce(JSON.stringify({ closedByPullRequestsReferences: [] }));

      const result = resolveLinkedPrs(2414, pulls);

      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(10);
    });

    it("merged_at !== null → state merged; merged_at null keeps the PR's own state", () => {
      const pulls = [
        { number: 12, state: "closed" as const, merged_at: "2026-01-01T00:00:00Z", head: { ref: "2414-x" } },
        { number: 13, state: "open" as const, merged_at: null, head: { ref: "2414-y" } },
        { number: 14, state: "closed" as const, merged_at: null, head: { ref: "2414-z" } },
      ];
      mockExec.mockReturnValueOnce(JSON.stringify({ closedByPullRequestsReferences: [] }));

      const result = resolveLinkedPrs(2414, pulls);

      expect(result).toHaveLength(3);
      expect(result.find((p) => p.number === 12)?.state).toBe("merged");
      expect(result.find((p) => p.number === 13)?.state).toBe("open");
      expect(result.find((p) => p.number === 14)?.state).toBe("closed");
    });

    it("stage-1 wins on number conflict; stage-2 only adds numbers stage-1 did not see", () => {
      const pulls = [
        { number: 20, state: "open" as const, merged_at: null, head: { ref: "2414-a" } },
        // PR 21 is in allPulls (state closed via merged_at null) so stage-2 can resolve its state.
        { number: 21, state: "closed" as const, merged_at: null, head: { ref: "other-branch" } },
      ];
      mockExec.mockReturnValueOnce(
        JSON.stringify({
          closedByPullRequestsReferences: [
            { number: 20 },
            { number: 21 },
          ],
        }),
      );

      const result = resolveLinkedPrs(2414, pulls);

      expect(result).toHaveLength(2);
      // Stage-1 wins for #20: state is "open" (from pulls list, matched prefix)
      const pr20 = result.find((p) => p.number === 20);
      expect(pr20?.state).toBe("open");
      // Stage-2 adds #21 with "closed" (resolved from pulls list)
      const pr21 = result.find((p) => p.number === 21);
      expect(pr21?.state).toBe("closed");
      // Sorted ascending by number
      expect(result[0].number).toBe(20);
      expect(result[1].number).toBe(21);
    });

    it("absent closing-ref PR throws — closing ref whose number is missing from the pulls list aborts", () => {
      // PR 999 is in closedByPullRequestsReferences but NOT in allPulls,
      // so its state cannot be resolved. Stage 2 must throw rather than
      // write a record with an undefined/defaulted state.
      const pulls = [
        { number: 30, state: "open" as const, merged_at: null, head: { ref: "2414-z" } },
      ];
      mockExec.mockReturnValueOnce(
        JSON.stringify({ closedByPullRequestsReferences: [{ number: 999 }] }),
      );

      expect(() => resolveLinkedPrs(2414, pulls)).toThrow(
        /closing-reference PR #999 for issue #2414 is absent from the repo pulls list/,
      );
    });
  });
});
