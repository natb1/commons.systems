import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

import { execFileSync } from "node:child_process";
import { resolveLinkedPrs } from "../scripts/refresh.js";
import { validateTracker, type ExecutionTracker } from "../src/tracker.js";

const mockExec = vi.mocked(execFileSync);

// Build an Error shaped like execFileSync's throw (strings because encoding:utf8).
function ghError(stderr: string): Error {
  return Object.assign(new Error("Command failed"), { stderr, stdout: "", status: 1 });
}

// Fixtures
const PULLS_LIST_FIXTURE: RawPull[][] = [
  [
    // PR 900: merged, head branch does NOT start with "2417-"
    { number: 900, state: "closed", merged_at: "2026-01-01T00:00:00Z", head: { ref: "renamed-branch" } },
    // PR 901: open, head branch starts with "2417-" (stage-1 match)
    { number: 901, state: "open", merged_at: null, head: { ref: "2417-some-branch" } },
    // PR 902: merged, head branch starts with "2417-" AND in closing refs (conflict test)
    { number: 902, state: "closed", merged_at: "2026-02-01T00:00:00Z", head: { ref: "2417-other-branch" } },
  ],
];

interface RawPull {
  number: number;
  state: "open" | "closed";
  merged_at: string | null;
  head: { ref: string };
}

function makeExecMock(opts: {
  pullsPages: RawPull[][];
  closingRefs: { number: number }[];
}): void {
  mockExec.mockImplementation((_cmd, args) => {
    if (!args) throw new Error("args not provided to mock");
    if (args.includes("api") && args.some((a) => a.includes("/pulls"))) {
      return JSON.stringify(opts.pullsPages);
    }
    if (args.includes("issue") && args.includes("view")) {
      return JSON.stringify({ closedByPullRequestsReferences: opts.closingRefs });
    }
    throw new Error(`Unexpected gh call: ${args.join(" ")}`);
  });
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
// returns the supplied closing-references view. The merged refresh.ts resolves
// each closing-ref's state from the stage-1 pulls list, so every closing-ref
// number must also appear in `pages`.
function driveBothSucceed(
  pages: { number: number; state: "open" | "closed"; merged_at: string | null; ref: string }[][],
  closingRefs: { number: number }[],
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
    // Both stages report PR #500. Stage 1's merged_at-derived state ("merged")
    // must win; the closing-ref only contributes the number, and stage 1
    // already has it, so it is skipped entirely.
    driveBothSucceed(
      [[{ number: 500, state: "closed", merged_at: "2026-06-01T00:00:00Z", ref: "123-feature" }]],
      [{ number: 500 }],
    );
    expect(resolveLinkedPrs(123)).toEqual([{ number: 500, state: "merged" }]);
  });

  it("adds a stage-2 PR that stage 1 did not see (additive path)", () => {
    // Stage 1 finds the open in-progress PR #501 (branch-prefix match); stage 2
    // contributes a separate closing reference #502 not matched by the prefix.
    // #502 still appears in the pulls list, so its state resolves to "merged".
    driveBothSucceed(
      [
        [
          { number: 501, state: "open", merged_at: null, ref: "123-wip" },
          { number: 502, state: "closed", merged_at: "2026-06-02T00:00:00Z", ref: "renamed-502" },
        ],
      ],
      [{ number: 502 }],
    );
    expect(resolveLinkedPrs(123)).toEqual([
      { number: 501, state: "open" },
      { number: 502, state: "merged" },
    ]);
  });
});

describe("resolveLinkedPrs", () => {
  it("core regression — stage-2-only closing ref has defined state (not undefined)", () => {
    // PR 900 head ref "renamed-branch" does NOT start with "2417-" so stage 1
    // skips it. Stage 2 (closedByPullRequestsReferences) adds it. Its state
    // must be resolved from the pulls list (merged_at set → "merged").
    makeExecMock({
      pullsPages: PULLS_LIST_FIXTURE,
      closingRefs: [{ number: 900 }],
    });

    const result = resolveLinkedPrs(2417);

    const pr900Entries = result.filter((p) => p.number === 900);
    expect(pr900Entries).toHaveLength(1);
    const pr900 = pr900Entries[0];
    expect(pr900.state).not.toBeUndefined();
    expect(pr900.state).toBe("merged");
  });

  it("validateTracker round-trip — record with resolveLinkedPrs result passes validation after JSON round-trip", () => {
    // This reproduces the old failure mode: JSON.stringify dropped undefined state keys,
    // causing validateTracker to reject the re-parsed record.
    makeExecMock({
      pullsPages: PULLS_LIST_FIXTURE,
      closingRefs: [{ number: 900 }],
    });

    const linkedPrs = resolveLinkedPrs(2417);

    const record: ExecutionTracker = {
      node_id: "test-node",
      issue_number: 2417,
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

  it("stage-1 prefix match — open PR with matching head branch is returned", () => {
    // PR 901: head ref "2417-some-branch" starts with "2417-", not in closing refs.
    makeExecMock({
      pullsPages: PULLS_LIST_FIXTURE,
      closingRefs: [],
    });

    const result = resolveLinkedPrs(2417);

    const pr901Entries = result.filter((p) => p.number === 901);
    expect(pr901Entries).toHaveLength(1);
    const pr901 = pr901Entries[0];
    expect(pr901.state).toBe("open");
  });

  it("stage-1 wins on conflict — PR in both prefix list and closing refs is not duplicated and keeps stage-1 state", () => {
    // PR 902: head ref "2417-other-branch" matches stage 1 (merged via merged_at).
    // Also appears in closedByPullRequestsReferences. Should appear once with "merged".
    makeExecMock({
      pullsPages: PULLS_LIST_FIXTURE,
      closingRefs: [{ number: 902 }],
    });

    const result = resolveLinkedPrs(2417);

    const pr902Entries = result.filter((p) => p.number === 902);
    expect(pr902Entries).toHaveLength(1);
    expect(pr902Entries[0].state).toBe("merged");
  });

  it("absent closing-ref PR throws — closing ref whose number is missing from the pulls list aborts", () => {
    // PR 999 is in closedByPullRequestsReferences but NOT in the paginated
    // pulls list, so its state cannot be resolved. Stage 2 must throw rather
    // than write a record with an undefined/defaulted state.
    makeExecMock({
      pullsPages: PULLS_LIST_FIXTURE,
      closingRefs: [{ number: 999 }],
    });

    expect(() => resolveLinkedPrs(2417)).toThrow(
      /closing-reference PR #999 for issue #2417 is absent from the repo pulls list/,
    );
  });
});
