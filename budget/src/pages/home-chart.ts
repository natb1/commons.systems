import { hierarchy, tree, type HierarchyNode } from "d3-hierarchy";

export interface SerializedChartTransaction {
  category: string;
  amount: number;
  reimbursement: number;
  timestampMs: number | null;
}

export interface CategoryNode {
  name: string;
  fullPath: string;
  value: number;
  count: number;
  children: CategoryNode[];
}

function computeNetAmount(amount: number, reimbursement: number): number {
  return amount * (1 - reimbursement / 100);
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Return the Monday 00:00 UTC for the week containing `ms`. */
function weekStart(ms: number): number {
  const d = new Date(ms);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** Compute sorted distinct week-start timestamps from transactions. */
export function distinctWeeks(txns: SerializedChartTransaction[]): number[] {
  const set = new Set<number>();
  for (const t of txns) {
    if (t.timestampMs !== null) set.add(weekStart(t.timestampMs));
  }
  return [...set].sort((a, b) => a - b);
}

/** Filter transactions to a window of `numWeeks` ending at `endWeekStart`. */
export function filterByWeeks(
  txns: SerializedChartTransaction[],
  weeks: number[],
  numWeeks: number,
  endWeekIdx: number,
): SerializedChartTransaction[] {
  if (weeks.length === 0) return [];
  const endMs = weeks[endWeekIdx];
  const startMs = endMs - (numWeeks - 1) * WEEK_MS;
  return txns.filter(t => {
    if (t.timestampMs === null) return false;
    const ws = weekStart(t.timestampMs);
    return ws >= startMs && ws <= endMs;
  });
}

/** Build a category tree from transactions. */
export function buildCategoryTree(txns: SerializedChartTransaction[]): CategoryNode {
  const root: CategoryNode = { name: "All", fullPath: "", value: 0, count: 0, children: [] };

  for (const t of txns) {
    const net = computeNetAmount(t.amount, t.reimbursement);
    if (net <= 0) continue;
    const parts = t.category.split(":");
    let node = root;
    let path = "";
    for (const part of parts) {
      path = path ? `${path}:${part}` : part;
      let child = node.children.find(c => c.name === part);
      if (!child) {
        child = { name: part, fullPath: path, value: 0, count: 0, children: [] };
        node.children.push(child);
      }
      node = child;
    }
    node.value += net;
    node.count += 1;
  }

  // Roll up values: parent = sum of children (or own value if leaf)
  function rollUp(n: CategoryNode): number {
    if (n.children.length > 0) {
      n.value = n.children.reduce((s, c) => s + rollUp(c), 0);
      n.count = n.children.reduce((s, c) => s + c.count, 0);
    }
    return n.value;
  }
  rollUp(root);

  return root;
}

// Color palette for top-level categories
const CATEGORY_COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac",
];

function categoryColor(topLevelIndex: number, depth: number): string {
  const base = CATEGORY_COLORS[topLevelIndex % CATEGORY_COLORS.length];
  if (depth <= 1) return base;
  // Lighten by mixing with white
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);
  const factor = Math.min(0.3 * (depth - 1), 0.6);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

const SVG_NS = "http://www.w3.org/2000/svg";

interface LayoutNode {
  data: CategoryNode;
  x: number; // tree x → SVG y
  y: number; // tree y → SVG x
  depth: number;
  parent: LayoutNode | null;
  children?: LayoutNode[];
  topLevelIndex: number;
  collapsed: boolean;
}

interface IndexedNode extends HierarchyNode<CategoryNode> {
  topLevelIndex: number;
}

function asIndexed(node: HierarchyNode<CategoryNode>): IndexedNode {
  return node as IndexedNode;
}

function assignTopLevelIndex(node: HierarchyNode<CategoryNode>, index: number): void {
  asIndexed(node).topLevelIndex = index;
  node.children?.forEach(c => assignTopLevelIndex(c, index));
}

export function hydrateCategorySankey(container: HTMLElement): void {
  const dataAttr = container.dataset.transactions;
  if (!dataAttr) return;
  const allTxns: SerializedChartTransaction[] = JSON.parse(dataAttr);
  if (allTxns.length === 0) {
    container.textContent = "No transaction data to chart.";
    return;
  }

  const weeks = distinctWeeks(allTxns);
  if (weeks.length === 0) {
    container.textContent = "No dated transactions to chart.";
    return;
  }

  const collapsedPaths = new Set<string>();
  let currentNumWeeks = 12;
  let currentEndWeekIdx = weeks.length - 1;

  // Controls
  const controlsDiv = container.previousElementSibling;
  const weeksInput = controlsDiv?.querySelector("#sankey-weeks") as HTMLInputElement | null;
  const endSlider = controlsDiv?.querySelector("#sankey-end-week") as HTMLInputElement | null;
  const endLabel = controlsDiv?.querySelector("#sankey-end-label") as HTMLElement | null;

  if (endSlider) {
    endSlider.min = "0";
    endSlider.max = String(weeks.length - 1);
    endSlider.value = String(currentEndWeekIdx);
  }
  if (endLabel) {
    endLabel.textContent = formatDate(weeks[currentEndWeekIdx]);
  }

  const fg = getComputedStyle(container).getPropertyValue("--fg").trim() || "#e0e0e0";

  function render(): void {
    const filtered = filterByWeeks(allTxns, weeks, currentNumWeeks, currentEndWeekIdx);
    const rootData = buildCategoryTree(filtered);

    if (rootData.value === 0) {
      container.replaceChildren();
      container.textContent = "No spending in selected window.";
      return;
    }

    // Prune collapsed subtrees for layout
    function pruneCollapsed(n: CategoryNode): CategoryNode {
      if (collapsedPaths.has(n.fullPath)) {
        return { ...n, children: [] };
      }
      return { ...n, children: n.children.map(pruneCollapsed) };
    }
    const prunedRoot = pruneCollapsed(rootData);

    const root = hierarchy(prunedRoot, d => d.children.length > 0 ? d.children : undefined);

    // Assign top-level color indices
    root.children?.forEach((child, i) => assignTopLevelIndex(child, i));
    asIndexed(root).topLevelIndex = -1;

    const leafCount = root.leaves().length;
    const nodeHeight = 24;
    const treeHeight = Math.max(leafCount * nodeHeight, 200);
    const treeWidth = (root.height + 1) * 200;
    const margin = { top: 20, right: 160, bottom: 20, left: 10 };
    const svgWidth = treeWidth + margin.left + margin.right;
    const svgHeight = treeHeight + margin.top + margin.bottom;

    const layout = tree<CategoryNode>().size([treeHeight, treeWidth]);
    const treeRoot = layout(root);

    const nodes = treeRoot.descendants() as unknown as LayoutNode[];
    const links = treeRoot.links();

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("width", String(svgWidth));
    svg.setAttribute("height", String(svgHeight));

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("transform", `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);

    // Draw links as sankey bands
    // First, compute stacking offsets at each parent
    const parentStacks = new Map<HierarchyNode<CategoryNode>, number>();

    for (const link of links) {
      const source = link.source;
      const target = link.target;
      const parentValue = source.data.value;
      const childValue = target.data.value;

      if (parentValue === 0) continue;

      const parentH = Math.max((source.data.value / rootData.value) * treeHeight, 4);
      const childH = Math.max((target.data.value / rootData.value) * treeHeight, 4);
      const bandWidth = (childValue / parentValue) * parentH;

      const stackOffset = parentStacks.get(source) ?? 0;
      parentStacks.set(source, stackOffset + bandWidth);

      const sx = source.y;
      const sy = source.x - parentH / 2 + stackOffset;
      const tx = target.y;
      const ty = target.x - childH / 2;

      const midX = (sx + tx) / 2;
      const d = [
        `M ${sx} ${sy}`,
        `C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`,
        `L ${tx} ${ty + Math.max(bandWidth, 2)}`,
        `C ${midX} ${ty + Math.max(bandWidth, 2)}, ${midX} ${sy + Math.max(bandWidth, 2)}, ${sx} ${sy + Math.max(bandWidth, 2)}`,
        `Z`,
      ].join(" ");

      const topIdx = asIndexed(target).topLevelIndex ?? 0;
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", categoryColor(topIdx, target.depth));
      path.setAttribute("class", "sankey-link");

      const title = document.createElementNS(SVG_NS, "title");
      const pct = rootData.value > 0 ? ((childValue / rootData.value) * 100).toFixed(1) : "0.0";
      title.textContent = `${target.data.fullPath}\n${formatCurrency(childValue)} (${pct}%)\n${target.data.count} transactions`;
      path.appendChild(title);

      g.appendChild(path);
    }

    // Draw nodes
    for (const node of nodes) {
      if (node.depth === 0) continue; // skip root
      const h = Math.max((node.data.value / rootData.value) * treeHeight, 4);
      const w = 12;
      const topIdx = node.topLevelIndex ?? 0;
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
          if (collapsedPaths.has(node.data.fullPath)) {
            collapsedPaths.delete(node.data.fullPath);
          } else {
            collapsedPaths.add(node.data.fullPath);
          }
          render();
        });
      }
      nodeG.appendChild(rect);

      // Label
      if (h > 16) {
        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", String(w + 4));
        text.setAttribute("y", String(h / 2));
        text.setAttribute("dy", "0.35em");
        text.setAttribute("fill", fg);
        text.textContent = `${node.data.name} ${formatCurrency(node.data.value)}`;
        nodeG.appendChild(text);
      }

      // Tooltip
      const title = document.createElementNS(SVG_NS, "title");
      const pct = rootData.value > 0 ? ((node.data.value / rootData.value) * 100).toFixed(1) : "0.0";
      title.textContent = `${node.data.fullPath}\n${formatCurrency(node.data.value)} (${pct}%)\n${node.data.count} transactions`;
      nodeG.appendChild(title);

      g.appendChild(nodeG);
    }

    container.replaceChildren(svg);
  }

  render();

  // Debounce helper
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  function debounced(fn: () => void, ms: number): void {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, ms);
  }

  if (weeksInput) {
    weeksInput.addEventListener("input", () => {
      const v = parseInt(weeksInput.value, 10);
      if (Number.isFinite(v) && v >= 1) {
        currentNumWeeks = v;
        debounced(render, 100);
      }
    });
  }

  if (endSlider) {
    endSlider.addEventListener("input", () => {
      const v = parseInt(endSlider.value, 10);
      if (Number.isFinite(v) && v >= 0 && v < weeks.length) {
        currentEndWeekIdx = v;
        if (endLabel) endLabel.textContent = formatDate(weeks[currentEndWeekIdx]);
        debounced(render, 100);
      }
    });
  }

  // Responsive resize
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });
  observer.observe(container);
}
