import { describe, expect, it } from "vitest";
import {
  GraphSourceError,
  STALE_CLONE_THRESHOLD_MS,
  describeCloneAge,
  loadGraphView,
  readCloneFreshness,
  readGraphNodes,
  renderCloneAgeChrome,
  renderStaleCloneBanner,
  type CloneFreshness,
} from "../src/graph-source.js";

// --- Fake FSA handles --------------------------------------------------------
// Minimal in-memory stand-ins for the File System Access handles: exactly the
// surface graph-source touches (getDirectoryHandle / getFileHandle / entries /
// getFile), with the spec's DOMException names for the two lookup misses.

function file(content: string, lastModified = 0): FileSystemFileHandle {
  return {
    kind: "file" as const,
    async getFile() {
      return { text: async () => content, lastModified } as unknown as File; // type-safety-ok: minimal fake FSA File implementing only the fields graph-source reads
    },
  } as unknown as FileSystemFileHandle; // type-safety-ok: minimal fake FSA handle implementing only the surface graph-source touches
}

function dir(entries: Record<string, FileSystemHandle>): FileSystemDirectoryHandle {
  return {
    kind: "directory" as const,
    async getDirectoryHandle(name: string) {
      const entry = entries[name];
      if (entry === undefined) throw new DOMException(`${name} not found`, "NotFoundError");
      if (entry.kind !== "directory") throw new DOMException(`${name} is a file`, "TypeMismatchError");
      return entry;
    },
    async getFileHandle(name: string) {
      const entry = entries[name];
      if (entry === undefined) throw new DOMException(`${name} not found`, "NotFoundError");
      if (entry.kind !== "file") throw new DOMException(`${name} is a directory`, "TypeMismatchError");
      return entry;
    },
    async *entries() {
      for (const [name, handle] of Object.entries(entries)) {
        yield [name, handle] as [string, FileSystemHandle];
      }
    },
  } as unknown as FileSystemDirectoryHandle; // type-safety-ok: minimal fake FSA handle implementing only the surface graph-source touches
}

/** A valid node file's markdown, `extra` spliced into the frontmatter. */
function nodeFile(id: string, kind: string, extra = ""): string {
  return `---\nid: ${id}\nkind: ${kind}\nstatement: statement for ${id}\nowner: ai\nstatus: raw\n${extra}---\n# body\n`;
}

/** A clone root with a fresh standard `.git` dir and the given intentions files. */
function cloneRoot(
  intentions: Record<string, FileSystemHandle>,
  gitMtime = 0,
): FileSystemDirectoryHandle {
  return dir({
    ".git": dir({ HEAD: file("ref: refs/heads/main\n", gitMtime) }),
    intentions: dir(intentions),
  });
}

// --- readGraphNodes ------------------------------------------------------------

describe("readGraphNodes", () => {
  it("reads, validates, and returns nodes in node-id order, skipping README.md, non-md files, and subdirectories", async () => {
    const root = cloneRoot({
      "b-node.md": file(nodeFile("b-node", "tactic")),
      "a-node.md": file(nodeFile("a-node", "tactic")),
      // A prefix-hyphen sibling: `a-node` is a prefix of `a-node-extra`. Sorting
      // the raw file name would put `a-node-extra.md` before `a-node.md` (`.md`'s
      // `.` sorts after the extending `-`), diverging from the store's id-order.
      "a-node-extra.md": file(nodeFile("a-node-extra", "tactic")),
      "README.md": file("no frontmatter here"),
      "notes.txt": file("not markdown"),
      nested: dir({ "c-node.md": file(nodeFile("c-node", "tactic")) }),
    });
    const nodes = await readGraphNodes(root);
    // Node-id order (matching `listNodes`), NOT raw file-name order.
    expect(nodes.map((n) => n.id)).toEqual(["a-node", "a-node-extra", "b-node"]);
    // validateNode applied its defaults — the nodes are full IntentionNodes.
    expect(nodes[0].blocked_by).toEqual([]);
    expect(nodes[0].statement).toBe("statement for a-node");
  });

  it("throws one aggregate error naming EVERY invalid file, returning no partial graph", async () => {
    const root = cloneRoot({
      "good.md": file(nodeFile("good", "tactic")),
      "no-fence.md": file("# just markdown, no frontmatter\n"),
      "bad-owner.md": file(
        "---\nid: bad-owner\nkind: tactic\nstatement: s\nowner: nobody\nstatus: raw\n---\n",
      ),
    });
    const error = await readGraphNodes(root).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GraphSourceError);
    const message = (error as GraphSourceError).message; // type-safety-ok: instanceof asserted above; cast to read the typed .message field
    expect(message).toContain("no-fence.md");
    expect(message).toContain("bad-owner.md");
    expect(message).not.toContain("good.md");
  });

  it("throws a clear error when the picked directory has no intentions/", async () => {
    await expect(readGraphNodes(dir({}))).rejects.toThrow(/no "intentions\/" directory/);
  });
});

// --- readCloneFreshness ----------------------------------------------------------

describe("readCloneFreshness", () => {
  it("uses the newest of .git/HEAD and .git/FETCH_HEAD in a standard clone", async () => {
    const root = dir({
      ".git": dir({
        HEAD: file("ref: refs/heads/main\n", 1_000),
        FETCH_HEAD: file("deadbeef branch 'main'\n", 5_000),
      }),
      intentions: dir({}),
    });
    const freshness = await readCloneFreshness(root, 6_000);
    expect(freshness.lastSyncedAt).toBe(5_000);
    expect(freshness.ageMs).toBe(1_000);
    expect(freshness.stale).toBe(false);
  });

  it("rests on HEAD alone when the clone has never fetched (no FETCH_HEAD)", async () => {
    const root = dir({
      ".git": dir({ HEAD: file("ref: refs/heads/main\n", 2_000) }),
    });
    const freshness = await readCloneFreshness(root, 3_000);
    expect(freshness.lastSyncedAt).toBe(2_000);
    expect(freshness.ageMs).toBe(1_000);
  });

  it("follows a worktree checkout's .git FILE (absolute gitdir) and its commondir to FETCH_HEAD", async () => {
    // Models the retired `.bare` bare-repo layout (this repo no longer uses
    // it): `.git` is a one-line file pointing at `<root>/.bare/worktrees/main`,
    // whose `commondir` (../..) is the `.bare` common dir holding FETCH_HEAD.
    // The picked root contains both the `.git` pointer and the common dir — the
    // condition this suffix-probing branch needs. Whether this scenario is now
    // dead is tracked by tactic-retire-bare-layout.
    const root = dir({
      ".git": file("gitdir: /home/user/repo/.bare/worktrees/main\n"),
      ".bare": dir({
        FETCH_HEAD: file("deadbeef branch 'main'\n", 9_000),
        worktrees: dir({
          main: dir({
            HEAD: file("ref: refs/heads/main\n", 100),
            commondir: file("../..\n"),
          }),
        }),
      }),
      intentions: dir({}),
    });
    const freshness = await readCloneFreshness(root, 10_000);
    expect(freshness.lastSyncedAt).toBe(9_000);
    expect(freshness.stale).toBe(false);
  });

  it("marks the clone stale past the threshold", async () => {
    const root = dir({
      ".git": dir({ HEAD: file("ref: refs/heads/main\n", 0) }),
    });
    const freshness = await readCloneFreshness(root, STALE_CLONE_THRESHOLD_MS + 1);
    expect(freshness.stale).toBe(true);
  });

  it("throws a clear error when the picked directory is not a clone root", async () => {
    await expect(readCloneFreshness(dir({}), 0)).rejects.toThrow(/not a git clone root/);
  });

  it("throws a clear error when a gitdir pointer does not resolve inside the picked directory", async () => {
    const root = dir({ ".git": file("gitdir: /somewhere/else/entirely\n") });
    await expect(readCloneFreshness(root, 0)).rejects.toThrow(
      /does not resolve inside the picked directory/,
    );
  });
});

// --- loadGraphView -----------------------------------------------------------------

describe("loadGraphView", () => {
  const intentions = {
    "kind-tactic.md": file(nodeFile("kind-tactic", "kind", "attributes:\n  goal_layer: true\n")),
    "t-root.md": file(nodeFile("t-root", "tactic")),
    "t-child.md": file(nodeFile("t-child", "tactic", "parent: t-root\n")),
  };

  it("returns the ready view — nodes, built tree, and attention rank — for a fresh clone", async () => {
    const now = 1_000_000;
    const result = await loadGraphView(cloneRoot(intentions, now - 1_000), now);
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") throw new Error("unreachable");
    expect(result.view.nodes).toHaveLength(3);
    // The forest: kind-tactic and t-root are roots; t-child hangs off t-root.
    const rootIds = result.view.tree.map((n) => n.id).sort();
    expect(rootIds).toEqual(["kind-tactic", "t-root"]);
    const tRoot = result.view.tree.find((n) => n.id === "t-root")!; // type-safety-ok: fixture-controlled — "t-root" is a root in the fixed intentions map above
    expect(tRoot.children.map((c) => c.id)).toEqual(["t-child"]);
    // Rank resolved client-side for the goal-layer (tactic) nodes.
    expect(result.view.attention.get("t-root")).toBeDefined();
    expect(result.view.attention.get("t-child")).toBeDefined();
    expect(result.view.attention.get("kind-tactic")).toBeUndefined();
    expect(result.view.freshness.stale).toBe(false);
  });

  it("returns the stale variant WITHOUT a view past the threshold — stale rank cannot render silently", async () => {
    const now = STALE_CLONE_THRESHOLD_MS + 10_000;
    const result = await loadGraphView(cloneRoot(intentions, 0), now);
    expect(result.kind).toBe("stale");
    expect("view" in result).toBe(false);
    if (result.kind !== "stale") throw new Error("unreachable");
    expect(result.freshness.stale).toBe(true);
  });
});

// --- Staleness chrome ------------------------------------------------------------------

describe("staleness chrome", () => {
  const freshnessOf = (ageMs: number, stale = false): CloneFreshness => ({
    lastSyncedAt: 0,
    ageMs,
    stale,
  });

  it("describes the clone age in minutes, hours, and days", () => {
    expect(describeCloneAge(freshnessOf(10_000))).toBe("synced under a minute ago");
    expect(describeCloneAge(freshnessOf(3 * 60_000))).toBe("synced 3m ago");
    expect(describeCloneAge(freshnessOf(5 * 3_600_000))).toBe("synced 5h ago");
    expect(describeCloneAge(freshnessOf(49 * 3_600_000))).toBe("synced 2d ago");
  });

  it("renders the clone age into the page chrome", () => {
    const chrome = renderCloneAgeChrome(freshnessOf(3 * 60_000));
    expect(chrome.className).toBe("graph-clone-age");
    expect(chrome.textContent).toBe("clone synced 3m ago");
  });

  it("renders the blocking stale banner as a loud alert naming the threshold and the remedy", () => {
    const banner = renderStaleCloneBanner(freshnessOf(10 * 3_600_000, true));
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.className).toBe("graph-stale-banner");
    expect(banner.textContent).toContain("Stale clone");
    expect(banner.textContent).toContain("6h freshness threshold");
    expect(banner.textContent).toContain("git fetch");
  });
});
