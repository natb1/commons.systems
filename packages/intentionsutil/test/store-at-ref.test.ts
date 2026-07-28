import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listNodesAtRef } from "../scripts/lib-store-at-ref.js";
import { writeNodeFromJson } from "../scripts/write-node.js";

// Tracks scratch dirs so each test cleans up after itself.
const scratch: string[] = [];

afterEach(() => {
  while (scratch.length > 0) {
    const dir = scratch.pop();
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  }
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

/** A bare-minimum node JSON, schema-valid, with the given overrides. */
function nodeJson(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    id: "tactic-fixture",
    kind: "tactic",
    statement: "A fixture tactic node.",
    owner: "human",
    status: "draft",
    parent: null,
    ...overrides,
  });
}

/** A fresh, empty origin repo with an `intentions/` dir, ready to receive fixtures. */
function makeOrigin(): string {
  const dir = mkdtempSync(join(tmpdir(), "store-at-ref-origin-"));
  scratch.push(dir);
  git(dir, "init", "--quiet", "-b", "main");
  git(dir, "config", "user.email", "test@example.com");
  git(dir, "config", "user.name", "Test");
  mkdirSync(join(dir, "intentions"));
  return dir;
}

function commitAll(repo: string, message: string): void {
  git(repo, "add", "-A");
  git(repo, "commit", "--quiet", "-m", message);
}

function cloneFull(origin: string): string {
  const dir = mkdtempSync(join(tmpdir(), "store-at-ref-clone-"));
  scratch.push(dir);
  const dest = join(dir, "repo");
  execFileSync("git", ["clone", "--quiet", `file://${origin}`, dest], { encoding: "utf8" });
  return dest;
}

describe("listNodesAtRef", () => {
  it("ignores a local uncommitted edit — reads only what's committed at the ref", () => {
    const origin = makeOrigin();
    writeNodeFromJson(join(origin, "intentions"), nodeJson({ office_hours: null }));
    commitAll(origin, "add tactic-fixture, not parked");

    const clone = cloneFull(origin);

    // Hand-edit the clone's WORKING TREE copy to look parked, but never commit
    // it. This is the stale-worktree false-positive scenario: a local checkout
    // that has drifted from origin/main must not leak into the answer.
    writeNodeFromJson(
      join(clone, "intentions"),
      nodeJson({
        office_hours: { reason: "needs a human call", since: "2026-07-01", recommendation: null },
      }),
    );
    expect(git(clone, "status", "--porcelain")).not.toBe("");

    const nodes = listNodesAtRef(clone, "origin/main");
    const node = nodes.find((n) => n.id === "tactic-fixture");
    expect(node).toBeDefined();
    expect(node?.office_hours).toBeNull();
  });

  it("reflects a node parked at commit time, round-tripped through the archive", () => {
    const origin = makeOrigin();
    writeNodeFromJson(
      join(origin, "intentions"),
      nodeJson({
        office_hours: { reason: "blocked on a decision", since: "2026-06-15", recommendation: "ask the author" },
      }),
    );
    commitAll(origin, "add tactic-fixture, parked");

    const clone = cloneFull(origin);
    const nodes = listNodesAtRef(clone, "origin/main");
    const node = nodes.find((n) => n.id === "tactic-fixture");
    expect(node).toBeDefined();
    expect(node?.office_hours).toEqual({
      reason: "blocked on a decision",
      since: "2026-06-15",
      recommendation: "ask the author",
    });
  });

  it("excludes a node committed only locally in the clone, not pushed to origin", () => {
    const origin = makeOrigin();
    writeNodeFromJson(join(origin, "intentions"), nodeJson({ id: "tactic-on-origin" }));
    commitAll(origin, "add tactic-on-origin");

    const clone = cloneFull(origin);

    // Add and commit a SECOND node in the clone only — origin (and therefore
    // the clone's origin/main remote-tracking ref) never sees it.
    writeNodeFromJson(join(clone, "intentions"), nodeJson({ id: "tactic-local-only" }));
    commitAll(clone, "add tactic-local-only, local commit not pushed");

    const nodes = listNodesAtRef(clone, "origin/main");
    const ids = nodes.map((n) => n.id);
    expect(ids).toContain("tactic-on-origin");
    expect(ids).not.toContain("tactic-local-only");
  });

  it("throws, naming the ref, when the ref does not exist", () => {
    const origin = makeOrigin();
    writeNodeFromJson(join(origin, "intentions"), nodeJson({}));
    commitAll(origin, "add tactic-fixture");

    const clone = cloneFull(origin);
    expect(() => listNodesAtRef(clone, "no-such-ref-xyz")).toThrow(/no-such-ref-xyz/);
  });

  it("returns nodes validated and sorted by id, regardless of authoring order", () => {
    const origin = makeOrigin();
    // Authored out of sorted order on purpose.
    writeNodeFromJson(join(origin, "intentions"), nodeJson({ id: "tactic-zebra" }));
    writeNodeFromJson(join(origin, "intentions"), nodeJson({ id: "tactic-alpha" }));
    writeNodeFromJson(join(origin, "intentions"), nodeJson({ id: "tactic-mike" }));
    commitAll(origin, "add three nodes out of order");

    const clone = cloneFull(origin);
    const nodes = listNodesAtRef(clone, "origin/main");
    const ids = nodes.map((n) => n.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids).toEqual(["tactic-alpha", "tactic-mike", "tactic-zebra"]);

    for (const node of nodes) {
      expect(typeof node.id).toBe("string");
      expect(node.id.length).toBeGreaterThan(0);
      expect(node.kind).toBe("tactic");
    }
  });
});
