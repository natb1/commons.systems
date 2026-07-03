import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ghWithRetry,
  fetchParentNumber,
  fetchOpenIssues,
  pruneClosedOwned,
  reconcileIssue,
  GhError,
  isTransientGhError,
  parseHttpStatus,
  buildIssueNode,
  extractScope,
} from "../scripts/backfill.js";
import { writeNode, readNode } from "../src/store.js";
import { writeTracker } from "../src/tracker.js";

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
  process.env.GH_RETRY_BASE_DELAY_MS = "0"; // instant retries
  delete process.env.GH_RETRY_ATTEMPTS; // default 4 unless a test sets it
  mockExec.mockReset();
});

describe("ghWithRetry", () => {
  it("retries a transient failure then succeeds", () => {
    mockExec
      .mockImplementationOnce(() => {
        throw ghError("gh: API rate limit (HTTP 429)");
      })
      .mockReturnValueOnce("ok");

    expect(ghWithRetry(["api", "x"])).toBe("ok");
    expect(mockExec).toHaveBeenCalledTimes(2);
  });

  it("exhausts attempts and throws a GhError", () => {
    process.env.GH_RETRY_ATTEMPTS = "3";
    mockExec.mockImplementation(() => {
      throw ghError("gh: error (HTTP 503) Service Unavailable");
    });

    let caught: unknown;
    try {
      ghWithRetry(["api", "x"]);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(GhError);
    if (!(caught instanceof GhError)) throw new Error("unreachable");
    expect(caught.httpStatus).toBe(503);
    expect(caught.message).toContain("api");
    expect(caught.message).toContain("x");
    expect(caught.message).toContain("HTTP 503");
    expect(mockExec).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-transient error", () => {
    mockExec.mockImplementation(() => {
      throw ghError("gh: Not Found (HTTP 404)", '{"status":"404"}');
    });

    let caught: unknown;
    try {
      ghWithRetry(["api", "x"]);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(GhError);
    if (!(caught instanceof GhError)) throw new Error("unreachable");
    expect(caught.httpStatus).toBe(404);
    expect(mockExec).toHaveBeenCalledTimes(1);
  });
});

describe("fetchParentNumber", () => {
  it("returns null on a real 404 (no parent)", () => {
    mockExec.mockImplementation(() => {
      throw ghError("gh: Not Found (HTTP 404)");
    });

    expect(fetchParentNumber(123)).toBeNull();
  });

  it("re-throws a rate-limit error rather than nulling", () => {
    process.env.GH_RETRY_ATTEMPTS = "2";
    mockExec.mockImplementation(() => {
      throw ghError("gh: API rate limit (HTTP 429)");
    });

    let caught: unknown;
    try {
      fetchParentNumber(123);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(GhError);
    if (!(caught instanceof GhError)) throw new Error("unreachable");
    expect(caught.httpStatus).toBe(429);
  });

  it("parses the parent number on the happy path", () => {
    mockExec.mockReturnValue("123\n");
    expect(fetchParentNumber(7)).toBe(123);
  });
});

describe("parseHttpStatus / isTransientGhError", () => {
  it("parses an HTTP status when present", () => {
    expect(parseHttpStatus("gh: error (HTTP 503)")).toBe(503);
  });

  it("returns null when no status is present", () => {
    expect(parseHttpStatus("no status")).toBeNull();
  });

  it("classifies transient and non-transient text", () => {
    expect(isTransientGhError("HTTP 429")).toBe(true);
    expect(isTransientGhError("HTTP 403 Forbidden")).toBe(false);
    expect(isTransientGhError("secondary rate limit")).toBe(true);
  });

  it("classifies the HTTP 5xx digit range directly", () => {
    expect(isTransientGhError("HTTP 500")).toBe(true);
    expect(isTransientGhError("HTTP 599")).toBe(true);
  });
});

describe("fetchOpenIssues", () => {
  it("flattens multi-page slurped results", () => {
    mockExec.mockReturnValue(
      JSON.stringify([
        [{ number: 1, title: "one", body: "b1" }],
        [{ number: 2, title: "two", body: "b2" }],
      ]),
    );

    const issues = fetchOpenIssues();
    expect(issues).toEqual([
      { number: 1, title: "one", body: "b1" },
      { number: 2, title: "two", body: "b2" },
    ]);
  });

  it("excludes pull requests", () => {
    mockExec.mockReturnValue(
      JSON.stringify([
        [
          { number: 1, title: "issue", body: "b1" },
          { number: 2, title: "pr", body: "b2", pull_request: {} },
        ],
      ]),
    );

    const issues = fetchOpenIssues();
    expect(issues).toEqual([{ number: 1, title: "issue", body: "b1" }]);
  });
});

describe("buildIssueNode", () => {
  it("sets reading to null at backfill time", () => {
    const issue = { number: 42, title: "Fix the thing", body: null };
    const node = buildIssueNode(issue, null);
    expect(node.reading).toBeNull();
  });

  it("sets rationale from the issue body scope section", () => {
    const body = "## Scope\nDo the work.\n## Other\nignored";
    const issue = { number: 7, title: "Add feature", body };
    const node = buildIssueNode(issue, "tactic-5");
    expect(node.rationale).toBe(extractScope(body));
    expect(node.rationale).toBe("Do the work.");
  });

  it("links the parent when provided", () => {
    const issue = { number: 10, title: "Child issue", body: null };
    const node = buildIssueNode(issue, "tactic-5");
    expect(node.parent).toBe("tactic-5");
    expect(node.id).toBe("tactic-10");
    expect(node.owner).toBe("human");
    expect(node.status).toBe("raw");
  });

  it("emits kind 'tactic' and a github source attribute", () => {
    const issue = { number: 10, title: "Child issue", body: null };
    const node = buildIssueNode(issue, "tactic-5");
    expect(node.kind).toBe("tactic");
    expect(node.attributes).toEqual({
      source: "github:natb1/commons.systems#10",
    });
  });

  it("sets parent to null when no parent is provided", () => {
    const issue = { number: 3, title: "Root issue", body: null };
    const node = buildIssueNode(issue, null);
    expect(node.parent).toBeNull();
  });
});

describe("pruneClosedOwned", () => {
  it("prunes gh-backed leaves whose source issue closed, keeps open ones, and never touches hand-authored tactics", () => {
    const dir = mkdtempSync(join(tmpdir(), "intentions-prune-"));
    // Hand-authored slug tactic — no attributes.source → authoritative.
    writeNode(dir, {
      id: "tactic-populate-tactic-serves",
      kind: "tactic",
      statement: "Hand-authored, no gh source",
      owner: "human",
      status: "raw",
      serves: ["strategy-graph-drives-dispatch"],
    });
    // gh-backed leaf whose issue is still open → kept.
    writeNode(dir, {
      id: "tactic-100",
      kind: "tactic",
      statement: "Open issue",
      owner: "human",
      status: "raw",
      attributes: { source: "github:natb1/commons.systems#100" },
    });
    // gh-backed leaf whose issue closed → pruned.
    writeNode(dir, {
      id: "tactic-200",
      kind: "tactic",
      statement: "Closed issue",
      owner: "human",
      status: "raw",
      attributes: { source: "github:natb1/commons.systems#200" },
    });
    // A hand-maintained non-tactic node (no source) survives.
    writeNode(dir, {
      id: "kind-tactic",
      kind: "kind",
      statement: "Tactic kind node",
      owner: "human",
      status: "codified",
    });
    // README companion doc and a legacy generated leaf.
    writeFileSync(join(dir, "README.md"), "");
    writeFileSync(join(dir, "issue-1.md"), ""); // legacy pre-rename leaf name

    pruneClosedOwned(dir, new Set([100]));

    expect(existsSync(join(dir, "tactic-populate-tactic-serves.md"))).toBe(true);
    expect(existsSync(join(dir, "tactic-100.md"))).toBe(true);
    expect(existsSync(join(dir, "tactic-200.md"))).toBe(false);
    expect(existsSync(join(dir, "kind-tactic.md"))).toBe(true);
    expect(existsSync(join(dir, "README.md"))).toBe(true);
    expect(existsSync(join(dir, "issue-1.md"))).toBe(false); // legacy → unconditional
  });
});

describe("reconcileIssue", () => {
  // fetchParentNumber's /parent GET 404s when an issue has no parent.
  function mockNoParent(): void {
    mockExec.mockImplementation(() => {
      throw ghError("gh: Not Found (HTTP 404)");
    });
  }

  it("preserves graph-owned fields while syncing gh-derived fields on an existing owned tactic", () => {
    mockNoParent();
    const dir = mkdtempSync(join(tmpdir(), "intentions-reconcile-"));
    const noTrackers = join(dir, "no-trackers");

    // Pre-existing gh-backed tactic carrying dialectic-populated graph-owned
    // fields and a stale statement/parent/rationale/source.
    writeNode(dir, {
      id: "tactic-500",
      kind: "tactic",
      statement: "Stale title",
      owner: "ai",
      status: "delegated",
      parent: "tactic-999",
      rationale: "stale rationale",
      serves: ["strategy-graph-drives-dispatch"],
      attention: { boost: 2, override: null, rationale: "hot work" },
      attributes: { source: "github:natb1/commons.systems#500", cost: "high" },
    });

    reconcileIssue(
      dir,
      noTrackers,
      { number: 500, title: "  Fresh title  ", body: "## Scope\nNew scope.\n" },
      new Set([500]),
    );

    const node = readNode(dir, "tactic-500");
    // gh-derived fields synced in.
    expect(node.statement).toBe("Fresh title");
    expect(node.parent).toBeNull(); // parent 404 → null
    expect(node.rationale).toBe("New scope.");
    expect(node.attributes.source).toBe("github:natb1/commons.systems#500");
    // graph-owned fields preserved.
    expect(node.owner).toBe("ai");
    expect(node.status).toBe("delegated");
    expect(node.serves).toEqual(["strategy-graph-drives-dispatch"]);
    expect(node.attention).toEqual({ boost: 2, override: null, rationale: "hot work" });
    expect(node.attributes.cost).toBe("high"); // extra attributes key preserved
  });

  it("writes a fresh leaf for a new open issue, matching buildIssueNode", () => {
    mockNoParent();
    const dir = mkdtempSync(join(tmpdir(), "intentions-reconcile-"));
    const noTrackers = join(dir, "no-trackers");
    const issue = { number: 42, title: "Brand new", body: "## Scope\nDo it.\n" };

    reconcileIssue(dir, noTrackers, issue, new Set([42]));

    const node = readNode(dir, "tactic-42");
    const expected = buildIssueNode(issue, null);
    expect(node.statement).toBe(expected.statement);
    expect(node.rationale).toBe(expected.rationale);
    expect(node.parent).toBeNull();
    expect(node.serves).toEqual([]);
    expect(node.reading).toBeNull();
    expect(node.attributes).toEqual({ source: "github:natb1/commons.systems#42" });
  });

  it("skips an issue a tracker maps to an existing hand-authored node id (no gh-shadow tactic)", () => {
    const dir = mkdtempSync(join(tmpdir(), "intentions-reconcile-"));
    const trackersDir = mkdtempSync(join(tmpdir(), "trackers-reconcile-"));

    // Hand-authored node the tracker points issue 900 at.
    writeNode(dir, {
      id: "tactic-first-sensor-pass",
      kind: "tactic",
      statement: "Hand-authored, tracker-mapped",
      owner: "human",
      status: "raw",
    });
    writeTracker(trackersDir, {
      node_id: "tactic-first-sensor-pass",
      issue_number: 900,
      state: "open",
      linked_prs: [],
      dispatch_labels: [],
      refreshed_at: "2026-01-01T00:00:00.000Z",
    });

    reconcileIssue(
      dir,
      trackersDir,
      { number: 900, title: "gh title", body: null },
      new Set([900]),
    );

    // No gh-shadow node written; the hand-authored node is untouched; gh not hit.
    expect(existsSync(join(dir, "tactic-900.md"))).toBe(false);
    expect(readNode(dir, "tactic-first-sensor-pass").statement).toBe(
      "Hand-authored, tracker-mapped",
    );
    expect(mockExec).not.toHaveBeenCalled();
  });
});
