import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

import { execFileSync } from "node:child_process";
import { resolveLinkedPrs } from "../scripts/refresh.js";
import { validateTracker, type ExecutionTracker } from "../src/tracker.js";

const mockExec = vi.mocked(execFileSync);

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
