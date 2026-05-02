import { hierarchy, tree, type HierarchyNode } from "d3-hierarchy";
import { formatCurrency } from "../format.js";
import type { CategoryNode } from "./home-chart.js";

export type { CategoryNode };

export interface SankeyRenderInput {
  rootData: CategoryNode;
  collapsedPaths: ReadonlySet<string>;
  containerWidth: number;
  fg: string;
  onToggleCollapse: (fullPath: string) => void;
  onSelectCategory: (fullPath: string) => void;
}

const SVG_NS = "http://www.w3.org/2000/svg";

const OVERLAP_GAP = 8;
const NODE_SCALE = 0.6;

const CATEGORY_COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac",
];

function categoryColor(topLevelIndex: number, depth: number): string {
  const base = CATEGORY_COLORS[topLevelIndex % CATEGORY_COLORS.length];
  if (depth <= 1) return base;
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);
  const factor = Math.min(0.3 * (depth - 1), 0.6);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

function tooltipText(data: CategoryNode, rootValue: number): string {
  const pct = rootValue > 0 ? ((data.value / rootValue) * 100).toFixed(1) : "0.0";
  return `${data.fullPath}\n${formatCurrency(data.value)}/wk (${pct}%)\n${data.count} transactions`;
}

function nodeHeight(value: number, rootValue: number, treeHeight: number): number {
  return Math.max((value / rootValue) * treeHeight * NODE_SCALE, 4);
}

/**
 * Post-process d3.tree positions so proportional-height node rects never
 * overlap.  For each depth column we push nodes apart where needed, then
 * re-centre the column within the available height.  When the total required
 * height exceeds the available space we compress and reposition to fit.
 */
function resolveOverlaps(
  nodes: HierarchyNode<CategoryNode>[],
  rootValue: number,
  treeHeight: number,
): void {
  const byDepth = new Map<number, HierarchyNode<CategoryNode>[]>();
  for (const node of nodes) {
    if (node.depth === 0) continue;
    const group = byDepth.get(node.depth) ?? [];
    group.push(node);
    byDepth.set(node.depth, group);
  }

  for (const [, group] of byDepth) {
    group.sort((a, b) => a.x! - b.x!);
    const heights = group.map(n => nodeHeight(n.data.value, rootValue, treeHeight));

    for (let i = 1; i < group.length; i++) {
      const minDist = (heights[i - 1] + heights[i]) / 2 + OVERLAP_GAP;
      if (group[i].x! - group[i - 1].x! < minDist) {
        group[i].x = group[i - 1].x! + minDist;
      }
    }

    const top = group[0].x! - heights[0] / 2;
    const bottom = group[group.length - 1].x! + heights[group.length - 1] / 2;
    const used = bottom - top;

    if (used <= treeHeight) {
      const offset = (treeHeight - used) / 2 - top;
      for (const node of group) node.x = node.x! + offset;
    } else {
      const scale = treeHeight / used;
      for (const node of group) {
        node.x = (node.x! - top) * scale;
      }
    }
  }
}

function pruneCollapsed(n: CategoryNode, collapsedPaths: ReadonlySet<string>): CategoryNode {
  if (collapsedPaths.has(n.fullPath)) {
    return { ...n, children: [] };
  }
  return { ...n, children: n.children.map(c => pruneCollapsed(c, collapsedPaths)) };
}

export function renderSankeySvg(input: SankeyRenderInput): SVGSVGElement {
  const { rootData, collapsedPaths, containerWidth, fg, onToggleCollapse, onSelectCategory } = input;

  const prunedRoot = pruneCollapsed(rootData, collapsedPaths);

  const root = hierarchy(prunedRoot, d => d.children.length > 0 ? d.children : undefined);

  const topLevelIndices = new Map<HierarchyNode<CategoryNode>, number>();
  function assignIndex(node: HierarchyNode<CategoryNode>, index: number): void {
    topLevelIndices.set(node, index);
    node.children?.forEach(c => assignIndex(c, index));
  }
  root.children?.forEach((child, i) => assignIndex(child, i));

  function getTopLevelIndex(node: HierarchyNode<CategoryNode>): number {
    const idx = topLevelIndices.get(node);
    if (idx === undefined) throw new Error(`Missing top-level index for node: ${node.data.fullPath}`);
    return idx;
  }

  const svgHeight = Math.round(containerWidth * 3 / 4);
  const margin = { top: 20, right: 160, bottom: 20, left: 10 };
  const treeWidth = containerWidth - margin.left - margin.right;
  const treeHeight = svgHeight - margin.top - margin.bottom;

  // Passing [treeHeight, treeWidth] produces a horizontal layout: node.x is vertical, node.y is horizontal
  const layout = tree<CategoryNode>().size([treeHeight, treeWidth]);
  const treeRoot = layout(root);

  const nodes = treeRoot.descendants();
  resolveOverlaps(nodes, rootData.value, treeHeight);

  const links = treeRoot.links();

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${containerWidth} ${svgHeight}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(svgHeight));

  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);
  svg.appendChild(g);

  // Track cumulative vertical offset within each parent node rect so child link bands stack without overlapping
  const parentStacks = new Map<HierarchyNode<CategoryNode>, number>();

  for (const link of links) {
    const source = link.source;
    const target = link.target;
    const parentValue = source.data.value;
    const childValue = target.data.value;

    if (parentValue === 0) continue;

    const parentH = nodeHeight(source.data.value, rootData.value, treeHeight);
    const childH = nodeHeight(target.data.value, rootData.value, treeHeight);
    const bandWidth = (childValue / parentValue) * parentH;

    const stackOffset = parentStacks.get(source) ?? 0;
    parentStacks.set(source, stackOffset + bandWidth);

    const sx = source.y;
    const sy = source.x - parentH / 2 + stackOffset;
    const tx = target.y;
    const ty = target.x - childH / 2;

    const midX = (sx + tx) / 2;
    const bw = Math.max(bandWidth, 2);
    const d = [
      `M ${sx} ${sy}`,
      `C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`,
      `L ${tx} ${ty + bw}`,
      `C ${midX} ${ty + bw}, ${midX} ${sy + bw}, ${sx} ${sy + bw}`,
      `Z`,
    ].join(" ");

    const topIdx = getTopLevelIndex(target);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", categoryColor(topIdx, target.depth));
    path.setAttribute("class", "sankey-link");
    path.style.pointerEvents = "none";

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = tooltipText(target.data, rootData.value);
    path.appendChild(title);

    g.appendChild(path);
  }

  for (const node of nodes) {
    if (node.depth === 0) continue;
    const h = nodeHeight(node.data.value, rootData.value, treeHeight);
    const w = 12;
    const topIdx = getTopLevelIndex(node);
    const hasChildren = (node.children?.length ?? 0) > 0 || collapsedPaths.has(node.data.fullPath);

    const nodeG = document.createElementNS(SVG_NS, "g");
    nodeG.setAttribute("class", "sankey-node");
    nodeG.setAttribute("transform", `translate(${node.y - w / 2},${node.x - h / 2})`);

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", String(w));
    rect.setAttribute("height", String(h));
    rect.setAttribute("fill", categoryColor(topIdx, node.depth));
    rect.setAttribute("rx", "2");
    if (hasChildren) {
      rect.style.cursor = "pointer";
      rect.addEventListener("click", () => {
        onToggleCollapse(node.data.fullPath);
      });
    }
    nodeG.appendChild(rect);

    if (h > 16) {
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", String(w + 4));
      text.setAttribute("y", String(h / 2));
      text.setAttribute("dy", "0.35em");
      text.setAttribute("fill", fg);
      text.style.cursor = "pointer";
      text.textContent = `${node.data.name} ${formatCurrency(node.data.value)}/wk`;
      text.addEventListener("click", () => {
        onSelectCategory(node.data.fullPath);
      });
      nodeG.appendChild(text);
    }

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = tooltipText(node.data, rootData.value);
    nodeG.appendChild(title);

    g.appendChild(nodeG);
  }

  return svg;
}
