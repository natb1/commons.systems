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
  pruneStaleNodes,
  GhError,
  isTransientGhError,
  parseHttpStatus,
  buildIssueNode,
  extractScope,
} from "../scripts/backfill.js";

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

describe("pruneStaleNodes", () => {
  it("removes tactic leaves and legacy issue leaves, preserving kind/virtue/strategy/delegation nodes and README", () => {
    const dir = mkdtempSync(join(tmpdir(), "intentions-prune-"));
    // pruneStaleNodes never reads content, so empty stub files suffice.
    writeFileSync(join(dir, "kind-tactic.md"), "");
    writeFileSync(join(dir, "virtue-x.md"), "");
    writeFileSync(join(dir, "strategy-y.md"), "");
    writeFileSync(join(dir, "delegation-z.md"), "");
    writeFileSync(join(dir, "README.md"), "");
    writeFileSync(join(dir, "tactic-1.md"), "");
    writeFileSync(join(dir, "tactic-2.md"), "");
    writeFileSync(join(dir, "issue-1.md"), ""); // legacy pre-rename leaf name

    pruneStaleNodes(dir);

    expect(existsSync(join(dir, "kind-tactic.md"))).toBe(true);
    expect(existsSync(join(dir, "virtue-x.md"))).toBe(true);
    expect(existsSync(join(dir, "strategy-y.md"))).toBe(true);
    expect(existsSync(join(dir, "delegation-z.md"))).toBe(true);
    expect(existsSync(join(dir, "README.md"))).toBe(true);
    expect(existsSync(join(dir, "tactic-1.md"))).toBe(false);
    expect(existsSync(join(dir, "tactic-2.md"))).toBe(false);
    expect(existsSync(join(dir, "issue-1.md"))).toBe(false);
  });
});
