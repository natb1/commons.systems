import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { IntentionTreePanel } from "../src/components/IntentionTreePanel.js";
import type { IntentionTreeNode, IntentionTreeView } from "../src/intention-tree.js";

afterEach(() => cleanup());

// Deterministic fixture: a root (non-frontier) + two frontier children.
const rootNode: IntentionTreeNode = {
  id: "root-1",
  statement: "Root intention statement",
  owner: "human",
  status: "codified",
  parent: null,
  children: [],
};

const childA: IntentionTreeNode = {
  id: "child-a",
  statement: "Child A statement",
  owner: "human",
  status: "delegated",
  parent: "root-1",
  children: [],
};

const childB: IntentionTreeNode = {
  id: "child-b",
  statement: "Child B statement",
  owner: "human",
  status: "refining",
  parent: "root-1",
  children: [],
};

// Wire children into the root
rootNode.children = [childA, childB];

const fixtureView: IntentionTreeView = {
  tree: [rootNode],
  frontierIds: new Set(["child-a", "child-b"]),
};

describe("IntentionTreePanel heading", () => {
  it("renders .intention-tree-heading with text INTENTION TREE", () => {
    const { container } = render(<IntentionTreePanel view={fixtureView} />);
    const heading = container.querySelector(".intention-tree-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("INTENTION TREE"); // type-safety-ok: asserted not-null by the preceding expect()
  });
});

describe("IntentionTreePanel node rendering", () => {
  it("renders one .intention-node li per node in the fixture (3 nodes total)", () => {
    const { container } = render(<IntentionTreePanel view={fixtureView} />);
    const nodes = container.querySelectorAll("li.intention-node");
    expect(nodes).toHaveLength(3);
  });

  it("frontier nodes carry .intention-node--frontier; non-frontier root does not", () => {
    const { container } = render(<IntentionTreePanel view={fixtureView} />);
    const frontierNodes = container.querySelectorAll(".intention-node--frontier");
    expect(frontierNodes).toHaveLength(2);
  });

  it("root node does not have .intention-node--frontier", () => {
    const { container } = render(<IntentionTreePanel view={fixtureView} />);
    // The root is the first li; find the li whose statement is the root's
    const allNodes = container.querySelectorAll("li.intention-node");
    // root-1 is not frontier — none of its classes should include --frontier
    // Walk all nodes and find root-1's li (it contains the root statement text)
    const rootLi = Array.from(allNodes).find((li) =>
      li.querySelector(".intention-node-statement")?.textContent === "Root intention statement",
    );
    expect(rootLi).toBeDefined();
    expect(rootLi!.classList.contains("intention-node--frontier")).toBe(false); // type-safety-ok: asserted defined by the preceding expect()
  });
});

describe("IntentionTreePanel badges", () => {
  it("owner and status badge text appear in .intention-node-badges", () => {
    const { container } = render(<IntentionTreePanel view={fixtureView} />);
    const badgeContainers = container.querySelectorAll(".intention-node-badges");
    expect(badgeContainers.length).toBeGreaterThan(0);
    // The root node has owner=human, status=codified
    const allText = Array.from(badgeContainers)
      .map((el) => el.textContent ?? "")
      .join(" ");
    expect(allText).toContain("human");
    expect(allText).toContain("codified");
  });

  it("renders a 'frontier' badge for each frontier node (2 occurrences)", () => {
    const { container } = render(<IntentionTreePanel view={fixtureView} />);
    // Collect all badges whose textContent is exactly "frontier"
    // Badges are rendered as spans by the ds Badge component
    const allBadgeEls = container.querySelectorAll(".intention-node-badges *");
    const frontierBadges = Array.from(allBadgeEls).filter(
      (el) => el.textContent === "frontier",
    );
    expect(frontierBadges).toHaveLength(2);
  });
});

describe("IntentionTreePanel empty view", () => {
  it("renders .empty with 'No intentions yet.' and zero .intention-node", () => {
    const emptyView: IntentionTreeView = {
      tree: [],
      frontierIds: new Set(),
    };
    const { container } = render(<IntentionTreePanel view={emptyView} />);
    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No intentions yet."); // type-safety-ok: asserted not-null by the preceding expect()
    expect(container.querySelectorAll(".intention-node")).toHaveLength(0);
  });
});
