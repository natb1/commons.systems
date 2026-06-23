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

// Drive the two gh calls resolveLinkedPrs makes: stage 1 (args[0] === "api")
// returns an empty pages array; stage 2 (args[0] === "issue") throws the
// supplied error so we can assert swallow-vs-rethrow behavior.
function driveStage2Throw(err: Error): void {
  mockExec.mockImplementation((_cmd: unknown, args?: readonly string[]) => {
    if (args?.[0] === "api") return JSON.stringify([[]]) as unknown as Buffer;
    throw err;
  });
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
