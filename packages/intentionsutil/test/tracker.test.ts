import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ExecutionTracker } from "../src/tracker.js";
import {
  issueToNodeId,
  listTrackers,
  nodeIdToIssue,
  readTracker,
  validateTracker,
  writeTracker,
} from "../src/tracker.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "trackers-"));
}

describe("tracker round-trip", () => {
  it("is lossless for a fully-populated record", () => {
    const dir = tempDir();
    const record: ExecutionTracker = {
      node_id: "goal-sync",
      issue_number: 42,
      state: "open",
      linked_prs: [
        { number: 100, state: "open" },
        { number: 101, state: "closed" },
        { number: 102, state: "merged" },
      ],
      dispatch_labels: ["dispatch:planned", "dispatch:qa-done"],
      refreshed_at: "2026-06-22T00:00:00.000Z",
    };

    writeTracker(dir, record);
    const read = readTracker(dir, record.node_id);
    expect(read).toEqual(record);
  });
});

describe("assertPathSafeId rejection", () => {
  it("throws on node_id containing '..'", () => {
    const dir = tempDir();
    expect(() =>
      writeTracker(dir, {
        node_id: "../evil",
        issue_number: 1,
        state: "open",
        linked_prs: [],
        dispatch_labels: [],
        refreshed_at: "2026-06-22T00:00:00.000Z",
      })
    ).toThrow();
  });

  it("throws on node_id containing '/'", () => {
    const dir = tempDir();
    expect(() =>
      writeTracker(dir, {
        node_id: "path/traversal",
        issue_number: 1,
        state: "open",
        linked_prs: [],
        dispatch_labels: [],
        refreshed_at: "2026-06-22T00:00:00.000Z",
      })
    ).toThrow();
  });

  it("throws on readTracker with node_id containing '..'", () => {
    const dir = tempDir();
    expect(() => readTracker(dir, "../evil")).toThrow();
  });

  it("throws on readTracker with node_id containing '/'", () => {
    const dir = tempDir();
    expect(() => readTracker(dir, "path/traversal")).toThrow();
  });
});

describe("listTrackers", () => {
  it("returns trackers sorted by node_id ascending", () => {
    const dir = tempDir();
    const ids = ["c-node", "a-node", "b-node"];
    for (const id of ids) {
      writeTracker(dir, {
        node_id: id,
        issue_number: 10,
        state: "open",
        linked_prs: [],
        dispatch_labels: [],
        refreshed_at: "2026-06-22T00:00:00.000Z",
      });
    }

    const trackers = listTrackers(dir);
    expect(trackers).toHaveLength(3);
    expect(trackers.map((t) => t.node_id)).toEqual(["a-node", "b-node", "c-node"]);
  });

  it("ignores non-.json files in the directory", () => {
    const dir = tempDir();
    writeTracker(dir, {
      node_id: "leaf-1",
      issue_number: 5,
      state: "closed",
      linked_prs: [],
      dispatch_labels: [],
      refreshed_at: "2026-06-22T00:00:00.000Z",
    });
    writeFileSync(join(dir, "README.md"), "# Trackers store\n\nNot a tracker.\n");

    const trackers = listTrackers(dir);
    expect(trackers.map((t) => t.node_id)).toEqual(["leaf-1"]);
  });
});

describe("validateTracker rejection via readTracker", () => {
  it("throws when issue_number is missing", () => {
    const dir = tempDir();
    writeFileSync(
      join(dir, "x.json"),
      JSON.stringify({
        node_id: "x",
        state: "open",
        linked_prs: [],
        dispatch_labels: [],
        refreshed_at: "2026-06-22T00:00:00.000Z",
      }) + "\n"
    );
    expect(() => readTracker(dir, "x")).toThrow();
  });

  it("throws when linked_prs[].state is not a valid enum value", () => {
    const dir = tempDir();
    writeFileSync(
      join(dir, "y.json"),
      JSON.stringify({
        node_id: "y",
        issue_number: 1,
        state: "open",
        linked_prs: [{ number: 99, state: "draft" }],
        dispatch_labels: [],
        refreshed_at: "2026-06-22T00:00:00.000Z",
      }) + "\n"
    );
    expect(() => readTracker(dir, "y")).toThrow();
  });

  it("validateTracker throws directly on malformed input", () => {
    expect(() => validateTracker({ node_id: "z" })).toThrow();
    expect(() => validateTracker({ node_id: "", issue_number: 1, state: "open", linked_prs: [], dispatch_labels: [], refreshed_at: "x" })).toThrow();
    expect(() => validateTracker(null)).toThrow();
  });
});

describe("mapping helpers", () => {
  it("nodeIdToIssue resolves 'issue-N' directly without a file", () => {
    const dir = tempDir();
    expect(nodeIdToIssue("issue-42", dir)).toBe(42);
  });

  it("nodeIdToIssue reads issue_number from a written tracker file", () => {
    const dir = tempDir();
    writeTracker(dir, {
      node_id: "goal-foo",
      issue_number: 7,
      state: "open",
      linked_prs: [],
      dispatch_labels: [],
      refreshed_at: "2026-06-22T00:00:00.000Z",
    });
    expect(nodeIdToIssue("goal-foo", dir)).toBe(7);
  });

  it("issueToNodeId returns node_id for a written tracker", () => {
    const dir = tempDir();
    writeTracker(dir, {
      node_id: "goal-foo",
      issue_number: 7,
      state: "open",
      linked_prs: [],
      dispatch_labels: [],
      refreshed_at: "2026-06-22T00:00:00.000Z",
    });
    expect(issueToNodeId(7, dir)).toBe("goal-foo");
  });

  it("issueToNodeId falls back to 'issue-N' when the dir does not exist", () => {
    const nonExistentDir = join(tempDir(), "does-not-exist");
    expect(issueToNodeId(99, nonExistentDir)).toBe("issue-99");
  });

  it("issueToNodeId falls back to 'issue-N' when no tracker matches the issue", () => {
    const emptyDir = tempDir();
    expect(issueToNodeId(99, emptyDir)).toBe("issue-99");
  });

  it("nodeIdToIssue returns null for an unmapped non-'issue-' id with no file", () => {
    const dir = tempDir();
    expect(nodeIdToIssue("goal-missing", dir)).toBeNull();
  });
});
