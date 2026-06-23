import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

import { execFileSync } from "node:child_process";
import { fetchAllPulls, resolveLinkedPrs } from "../scripts/refresh.js";

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

describe("resolveLinkedPrs", () => {
  it("issues zero gh api pulls calls — only the stage-2 issue-view call", () => {
    const prebuiltPulls = [
      { number: 2414, state: "open" as const, merged_at: null, head: { ref: "2414-feature" } },
    ];
    mockExec.mockReturnValueOnce(JSON.stringify({ closedByPullRequestsReferences: [] }));

    resolveLinkedPrs(2414, prebuiltPulls);

    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(mockExec.mock.calls[0][1][0]).toBe("issue");
    expect(mockExec.mock.calls[0][1][1]).toBe("view");
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
      ];
      mockExec.mockReturnValueOnce(
        JSON.stringify({
          closedByPullRequestsReferences: [
            { number: 20, state: "MERGED" },
            { number: 21, state: "CLOSED" },
          ],
        }),
      );

      const result = resolveLinkedPrs(2414, pulls);

      expect(result).toHaveLength(2);
      // Stage-1 wins for #20: state is "open", not "merged"
      const pr20 = result.find((p) => p.number === 20);
      expect(pr20?.state).toBe("open");
      // Stage-2 adds #21 with "closed"
      const pr21 = result.find((p) => p.number === 21);
      expect(pr21?.state).toBe("closed");
      // Sorted ascending by number
      expect(result[0].number).toBe(20);
      expect(result[1].number).toBe(21);
    });

    it("stage-2 gh issue view throw yields empty stage-2 contribution without aborting", () => {
      const pulls = [
        { number: 30, state: "open" as const, merged_at: null, head: { ref: "2414-z" } },
      ];
      mockExec.mockImplementationOnce(() => {
        throw ghError("gh: Not Found (HTTP 404)");
      });

      const result = resolveLinkedPrs(2414, pulls);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ number: 30, state: "open" });
    });
  });
});
