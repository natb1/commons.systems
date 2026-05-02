import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

import type { CategoryNode } from "../../src/pages/home-chart";
import { renderSankeySvg, type SankeyRenderInput } from "../../src/pages/sankey-render";

function makeNode(name: string, fullPath: string, value: number, children: CategoryNode[] = []): CategoryNode {
  return { name, fullPath, value, count: 1, children };
}

function makeRoot(children: CategoryNode[]): CategoryNode {
  const value = children.reduce((sum, c) => sum + c.value, 0);
  return { name: "All", fullPath: "", value, count: children.length, children };
}

function defaultInput(overrides: Partial<SankeyRenderInput> = {}): SankeyRenderInput {
  const food = makeNode("Food", "Food", 800);
  const transport = makeNode("Transport", "Transport", 400);
  const rootData = makeRoot([food, transport]);
  return {
    rootData,
    collapsedPaths: new Set(),
    containerWidth: 800,
    fg: "#ffffff",
    onToggleCollapse: () => {},
    onSelectCategory: () => {},
    ...overrides,
  };
}

describe("renderSankeySvg", () => {
  it("returns an SVGSVGElement with expected viewBox and dimensions", () => {
    const containerWidth = 800;
    const svg = renderSankeySvg(defaultInput({ containerWidth }));

    expect(svg instanceof SVGSVGElement).toBe(true);
    const expectedHeight = Math.round(containerWidth * 3 / 4); // 600
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${containerWidth} ${expectedHeight}`);
    expect(svg.getAttribute("width")).toBe("100%");
    expect(svg.getAttribute("height")).toBe(String(expectedHeight));
  });

  it("renders expected number of sankey-node and sankey-link elements", () => {
    // Tree: root -> Food -> [Groceries, Dining], root -> Transport
    // Visible nodes (depth > 0): Food, Groceries, Dining, Transport = 4
    // Links: root->Food, Food->Groceries, Food->Dining, root->Transport = 4
    const groceries = makeNode("Groceries", "Food:Groceries", 500);
    const dining = makeNode("Dining", "Food:Dining", 300);
    const food = makeNode("Food", "Food", 800, [groceries, dining]);
    const transport = makeNode("Transport", "Transport", 400);
    const rootData = makeRoot([food, transport]);

    const svg = renderSankeySvg(defaultInput({ rootData }));

    const nodes = svg.querySelectorAll(".sankey-node");
    const links = svg.querySelectorAll(".sankey-link");
    expect(nodes.length).toBe(4);
    expect(links.length).toBe(4);
  });

  it("collapsedPaths prunes descendants from the SVG", () => {
    // Tree: root -> Food -> [Groceries, Dining], root -> Transport
    const groceries = makeNode("Groceries", "Food:Groceries", 500);
    const dining = makeNode("Dining", "Food:Dining", 300);
    const food = makeNode("Food", "Food", 800, [groceries, dining]);
    const transport = makeNode("Transport", "Transport", 400);
    const rootData = makeRoot([food, transport]);

    const uncollapsed = renderSankeySvg(defaultInput({ rootData, collapsedPaths: new Set() }));
    const uncollapsedCount = uncollapsed.querySelectorAll(".sankey-node").length;

    // Collapsing "Food" prunes Groceries and Dining from the output
    const collapsed = renderSankeySvg(defaultInput({ rootData, collapsedPaths: new Set(["Food"]) }));
    const collapsedCount = collapsed.querySelectorAll(".sankey-node").length;

    expect(uncollapsedCount).toBe(4);
    expect(collapsedCount).toBe(2); // Food + Transport only
  });

  it("clicking a node rect with children invokes onToggleCollapse with correct fullPath", () => {
    // Use large values so nodeHeight > 16 and the node qualifies for rendering
    const groceries = makeNode("Groceries", "Food:Groceries", 500);
    const food = makeNode("Food", "Food", 800, [groceries]);
    const rootData = makeRoot([food]);

    const onToggleCollapse = vi.fn();
    const svg = renderSankeySvg(defaultInput({ rootData, onToggleCollapse }));

    // Find the sankey-node for Food (has children, so rect has cursor:pointer)
    const nodes = svg.querySelectorAll<SVGGElement>(".sankey-node");
    let foodRect: SVGRectElement | null = null;
    for (const nodeG of nodes) {
      const rect = nodeG.querySelector("rect");
      if (rect && rect.style.cursor === "pointer") {
        foodRect = rect;
        break;
      }
    }
    expect(foodRect).not.toBeNull();
    foodRect!.dispatchEvent(new Event("click"));
    expect(onToggleCollapse).toHaveBeenCalledWith("Food");
  });

  it("clicking a node label text invokes onSelectCategory with correct fullPath", () => {
    // Use large values so nodeHeight > 16 and the label renders
    const food = makeNode("Food", "Food", 800);
    const rootData = makeRoot([food]);

    const onSelectCategory = vi.fn();
    const svg = renderSankeySvg(defaultInput({ rootData, onSelectCategory }));

    const text = svg.querySelector<SVGTextElement>("text");
    expect(text).not.toBeNull();
    text!.dispatchEvent(new Event("click"));
    expect(onSelectCategory).toHaveBeenCalledWith("Food");
  });

  it("fg value flows through to text fill attribute", () => {
    const food = makeNode("Food", "Food", 800);
    const rootData = makeRoot([food]);
    const fg = "#abcdef";

    const svg = renderSankeySvg(defaultInput({ rootData, fg }));

    const texts = svg.querySelectorAll("text");
    expect(texts.length).toBeGreaterThan(0);
    const anyWithFg = [...texts].some(t => t.getAttribute("fill") === fg);
    expect(anyWithFg).toBe(true);
  });
});
