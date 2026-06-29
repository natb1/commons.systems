import { describe, it, expect } from "vitest";
import { buildTree, getDemoIntentionTree } from "../src/intention-tree.js";
import type { SlimIntentionNode } from "../src/intention-tree.js";

describe("buildTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildTree([])).toEqual([]);
  });

  it("multi-root forest: two nodes with parent null become two roots with no children", () => {
    const nodes: SlimIntentionNode[] = [
      { id: "a", statement: "A", owner: "human", status: "codified", parent: null },
      { id: "b", statement: "B", owner: "human", status: "raw", parent: null },
    ];
    const roots = buildTree(nodes);
    expect(roots).toHaveLength(2);
    expect(roots[0].id).toBe("a");
    expect(roots[0].children).toEqual([]);
    expect(roots[1].id).toBe("b");
    expect(roots[1].children).toEqual([]);
  });

  it("parent/child nesting: root with one child", () => {
    const nodes: SlimIntentionNode[] = [
      { id: "root", statement: "Root", owner: "human", status: "codified", parent: null },
      { id: "child", statement: "Child", owner: "human", status: "refining", parent: "root" },
    ];
    const roots = buildTree(nodes);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe("root");
    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].id).toBe("child");
    expect(roots[0].children[0].children).toEqual([]);
  });

  it("3-level chain: grandchild is nested under child", () => {
    const nodes: SlimIntentionNode[] = [
      { id: "r", statement: "Root", owner: "human", status: "codified", parent: null },
      { id: "c", statement: "Child", owner: "human", status: "delegated", parent: "r" },
      { id: "gc", statement: "Grandchild", owner: "human", status: "raw", parent: "c" },
    ];
    const roots = buildTree(nodes);
    expect(roots).toHaveLength(1);
    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].children).toHaveLength(1);
    expect(roots[0].children[0].children[0].id).toBe("gc");
    expect(roots[0].children[0].children[0].children).toEqual([]);
  });

  it("orphan-as-root: node with non-null parent absent from input is treated as root", () => {
    const nodes: SlimIntentionNode[] = [
      { id: "orphan", statement: "Orphan", owner: "human", status: "raw", parent: "missing-parent" },
    ];
    const roots = buildTree(nodes);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe("orphan");
    expect(roots[0].children).toEqual([]);
  });

  it("sibling order preserved: children appear in input order", () => {
    const nodes: SlimIntentionNode[] = [
      { id: "parent", statement: "Parent", owner: "human", status: "codified", parent: null },
      { id: "s1", statement: "Sibling 1", owner: "human", status: "raw", parent: "parent" },
      { id: "s2", statement: "Sibling 2", owner: "human", status: "raw", parent: "parent" },
      { id: "s3", statement: "Sibling 3", owner: "human", status: "refining", parent: "parent" },
    ];
    const roots = buildTree(nodes);
    expect(roots).toHaveLength(1);
    const children = roots[0].children;
    expect(children).toHaveLength(3);
    expect(children[0].id).toBe("s1");
    expect(children[1].id).toBe("s2");
    expect(children[2].id).toBe("s3");
  });
});

describe("getDemoIntentionTree", () => {
  it("returns a view with the expected shape", () => {
    const view = getDemoIntentionTree();
    expect(Array.isArray(view.tree)).toBe(true);
    expect(view.frontierIds).toBeInstanceOf(Set);
    expect(typeof view.trackers).toBe("object");
    expect(view.trackers).not.toBeNull();
  });

  it("tree contains nodes with the required fields", () => {
    const view = getDemoIntentionTree();
    expect(view.tree.length).toBeGreaterThan(0);

    function checkNode(node: (typeof view.tree)[number]): void {
      expect(typeof node.id).toBe("string");
      expect(typeof node.statement).toBe("string");
      expect(node.owner).toBeTruthy();
      expect(node.status).toBeTruthy();
      expect(Array.isArray(node.children)).toBe(true);
      for (const child of node.children) checkNode(child);
    }
    for (const root of view.tree) checkNode(root);
  });

  it("frontierIds is a Set of strings with non-negative size", () => {
    const view = getDemoIntentionTree();
    expect(view.frontierIds.size).toBeGreaterThanOrEqual(0);
    for (const id of view.frontierIds) {
      expect(typeof id).toBe("string");
    }
  });

  it("trackers is a plain object keyed by node id strings", () => {
    const view = getDemoIntentionTree();
    expect(Object.getPrototypeOf(view.trackers)).toBe(Object.prototype);
    for (const key of Object.keys(view.trackers)) {
      expect(typeof key).toBe("string");
    }
  });
});
