import { hierarchy, tree, type HierarchyNode } from "d3-hierarchy";
import { computeNetAmount, MS_PER_WEEK } from "../balance.js";
import { formatCurrency } from "../format.js";
import { showDropdown, registerAutocompleteListeners } from "@commons-systems/style/components/autocomplete";
import { parseJsonArray } from "./hydrate-util.js";

export type ChartMode = "spending" | "credits";

function isCardPaymentCategory(category: string): boolean {
  return category === "Transfer:CardPayment" || category.startsWith("Transfer:CardPayment:");
}

export interface SerializedChartTransaction {
  category: string;
  /** Dollars. Positive = spending/debit, negative = income/credit (either sign valid for income). */
  amount: number;
  reimbursement: number;
  timestampMs: number | null;
  hasBudget: boolean;
}

export interface CategoryNode {
  name: string;
  fullPath: string;
  value: number;
  count: number;
  children: CategoryNode[];
}

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

/**
 * Filter transactions to a window of `numWeeks` ending at `endWeekIdx`.
 * @param endWeekIdx - Index into the `weeks` array for the last week in the window
 */
export function filterByWeeks(
  txns: SerializedChartTransaction[],
  weeks: number[],
  numWeeks: number,
  endWeekIdx: number,
): SerializedChartTransaction[] {
  if (weeks.length === 0) return [];
  if (endWeekIdx < 0 || endWeekIdx >= weeks.length) {
    throw new RangeError(`endWeekIdx ${endWeekIdx} out of bounds for weeks array of length ${weeks.length}`);
  }
  const endMs = weeks[endWeekIdx];
  const startMs = endMs - (numWeeks - 1) * MS_PER_WEEK;
  return txns.filter(t => {
    if (t.timestampMs === null) return false;
    const ws = weekStart(t.timestampMs);
    return ws >= startMs && ws <= endMs;
  });
}

/**
 * Build a category tree from transactions.
 *
 * Filters transactions by mode. Spending mode includes transactions with
 * positive net amounts; credits mode includes transactions with negative net
 * amounts (sign-flipped to positive for display). Builds a hierarchy from
 * colon-separated category paths. Rolls up values and counts from leaves to
 * parents, then sorts children by value descending, name ascending. When
 * showCardPayment is false in spending mode, Transfer:CardPayment categories
 * (and subcategories) are excluded. When categoryFilter is non-empty, only
 * transactions whose category exactly matches the filter or starts with
 * categoryFilter + ":" (subcategories) are included.
 */
export function buildCategoryTree(
  txns: SerializedChartTransaction[],
  mode: ChartMode = "spending",
  unbudgetedOnly = false,
  showCardPayment = false,
  categoryFilter = "",
): CategoryNode {
  const root: CategoryNode = { name: "All", fullPath: "", value: 0, count: 0, children: [] };

  for (const t of txns) {
    const parts = t.category.split(":");
    const raw = computeNetAmount(t.amount, t.reimbursement);
    if (unbudgetedOnly && t.hasBudget) continue;
    if (mode === "spending") {
      if (!showCardPayment && isCardPaymentCategory(t.category)) continue;
      if (raw <= 0) continue;
    } else { // "credits"
      if (raw >= 0) continue;
    }
    if (categoryFilter && t.category !== categoryFilter && !t.category.startsWith(categoryFilter + ":")) continue;
    const net = mode === "credits" ? -raw : raw;
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

  // Roll up values and counts: parent totals = sum of children + own direct value
  function rollUp(n: CategoryNode): void {
    for (const c of n.children) {
      rollUp(c);
      n.value += c.value;
      n.count += c.count;
    }
  }
  rollUp(root);

  function sortChildren(n: CategoryNode): void {
    n.children.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
    n.children.forEach(sortChildren);
  }
  sortChildren(root);

  return root;
}

/** Divide all values in a category tree by a divisor (for per-week averages). */
export function divideTreeValues(node: CategoryNode, divisor: number): void {
  if (divisor <= 0 || !Number.isFinite(divisor)) {
    throw new RangeError(`divideTreeValues: divisor must be a positive finite number, got ${divisor}`);
  }
  node.value /= divisor;
  for (const c of node.children) divideTreeValues(c, divisor);
}

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

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function tooltipText(data: CategoryNode, rootValue: number): string {
  const pct = rootValue > 0 ? ((data.value / rootValue) * 100).toFixed(1) : "0.0";
  return `${data.fullPath}\n${formatCurrency(data.value)}/wk (${pct}%)\n${data.count} transactions`;
}

function nodeHeight(value: number, rootValue: number, treeHeight: number): number {
  return Math.max((value / rootValue) * treeHeight * NODE_SCALE, 4);
}

const SVG_NS = "http://www.w3.org/2000/svg";

const OVERLAP_GAP = 8;
const NODE_SCALE = 0.6;

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

function assertChartTransactions(data: unknown): asserts data is SerializedChartTransaction[] {
  if (!Array.isArray(data)) throw new Error("Expected array of chart transactions");
  for (const item of data) {
    if (typeof item !== "object" || item === null) throw new Error("Invalid chart transaction entry");
    const rec = item as Record<string, unknown>;
    if (typeof rec.category !== "string") throw new Error("Chart transaction missing category string");
    if (typeof rec.amount !== "number") throw new Error("Chart transaction missing amount number");
    if (typeof rec.reimbursement !== "number") throw new Error("Chart transaction missing reimbursement number");
    if (rec.timestampMs !== null && typeof rec.timestampMs !== "number") throw new Error("Chart transaction timestampMs must be number or null");
    if (typeof rec.hasBudget !== "boolean") throw new Error("Chart transaction missing hasBudget boolean");
  }
}

export function hydrateCategorySankey(container: HTMLElement): void {
  const scriptEl = container.querySelector('script[type="application/json"]');
  if (!scriptEl?.textContent) {
    throw new Error("category-sankey container is missing transaction data");
  }
  const parsed: unknown = JSON.parse(scriptEl.textContent);
  assertChartTransactions(parsed);
  const allTxns = parsed;
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
  let currentMode: ChartMode = "spending";
  let currentUnbudgetedOnly = false;
  let currentShowCardPayment = false;
  let currentCategoryFilter = "";

  const controlsDiv = document.getElementById("sankey-controls");
  if (!controlsDiv) throw new Error("sankey-controls element not found");
  const weeksInput = controlsDiv.querySelector("#sankey-weeks") as HTMLInputElement | null;
  const endSlider = controlsDiv.querySelector("#sankey-end-week") as HTMLInputElement | null;
  const endLabel = controlsDiv.querySelector("#sankey-end-label") as HTMLElement | null;
  const modeRadios = controlsDiv.querySelectorAll<HTMLInputElement>('input[name="sankey-mode"]');
  const unbudgetedToggle = controlsDiv.querySelector("#unbudgeted-toggle") as HTMLElement | null;
  const unbudgetedCheckbox = controlsDiv.querySelector("#sankey-unbudgeted") as HTMLInputElement | null;
  const cardPaymentToggle = controlsDiv.querySelector("#card-payment-toggle") as HTMLElement | null;
  const cardPaymentCheckbox = controlsDiv.querySelector("#sankey-card-payment") as HTMLInputElement | null;
  const categoryFilterInputRaw = controlsDiv.querySelector("#sankey-category-filter") as HTMLInputElement | null;
  if (!weeksInput || !endSlider || !endLabel || modeRadios.length === 0 || !unbudgetedToggle || !unbudgetedCheckbox || !cardPaymentToggle || !cardPaymentCheckbox || !categoryFilterInputRaw) {
    throw new Error("sankey control elements missing");
  }
  const categoryFilterInput: HTMLInputElement = categoryFilterInputRaw;

  const categoryOptions = parseJsonArray(controlsDiv.dataset.categoryOptions);

  endSlider.min = "0";
  endSlider.max = String(weeks.length - 1);
  endSlider.value = String(currentEndWeekIdx);
  endLabel.textContent = formatDate(weeks[currentEndWeekIdx]);

  const fg = getComputedStyle(container).getPropertyValue("--fg").trim() || "#e0e0e0";

  function render(): void {
    const containerWidth = container.clientWidth;
    if (containerWidth === 0) return;

    const filtered = filterByWeeks(allTxns, weeks, currentNumWeeks, currentEndWeekIdx);
    const rootData = buildCategoryTree(filtered, currentMode, currentUnbudgetedOnly, currentShowCardPayment, currentCategoryFilter);
    divideTreeValues(rootData, currentNumWeeks);

    if (rootData.value === 0) {
      container.textContent = currentMode === "credits"
        ? "No credits in selected window."
        : "No spending in selected window.";
      return;
    }

    function pruneCollapsed(n: CategoryNode): CategoryNode {
      if (collapsedPaths.has(n.fullPath)) {
        return { ...n, children: [] };
      }
      return { ...n, children: n.children.map(pruneCollapsed) };
    }
    const prunedRoot = pruneCollapsed(rootData);

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
          if (collapsedPaths.has(node.data.fullPath)) {
            collapsedPaths.delete(node.data.fullPath);
          } else {
            collapsedPaths.add(node.data.fullPath);
          }
          update();
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
          categoryFilterInput.value = node.data.fullPath;
          currentCategoryFilter = node.data.fullPath;
          update();
        });
        nodeG.appendChild(text);
      }

      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = tooltipText(node.data, rootData.value);
      nodeG.appendChild(title);

      g.appendChild(nodeG);
    }

    container.replaceChildren(svg);
  }

  function safeRender(): void {
    try {
      render();
    } catch (error) {
      container.textContent = "Chart rendering failed. Try refreshing the page.";
      setTimeout(() => { throw error; }, 0);
    }
  }

  function filterTable(): void {
    const rows = document.querySelectorAll<HTMLElement>("#transactions-table .txn-row");
    for (const row of rows) {
      const category = row.dataset.category ?? "";
      const hasBudget = row.dataset.hasBudget === "true";
      const isCardPayment = isCardPaymentCategory(category);
      const netAmount = parseFloat(row.dataset.netAmount ?? "0");
      const isCredit = netAmount < 0;

      let visible: boolean;
      if (currentMode === "credits") {
        visible = isCredit;
      } else {
        visible = !isCredit && (!currentUnbudgetedOnly || !hasBudget) && (currentShowCardPayment || !isCardPayment);
      }
      if (visible && currentCategoryFilter) {
        visible = category === currentCategoryFilter || category.startsWith(currentCategoryFilter + ":");
      }
      row.style.display = visible ? "" : "none";
    }
  }

  function update(): void {
    safeRender();
    filterTable();
  }

  update();

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  function debounced(fn: () => void, ms: number): void {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, ms);
  }

  weeksInput.addEventListener("input", () => {
    const v = parseInt(weeksInput.value, 10);
    if (Number.isFinite(v) && v >= 1) {
      currentNumWeeks = v;
      debounced(update, 100);
    }
  });

  endSlider.addEventListener("input", () => {
    const v = parseInt(endSlider.value, 10);
    if (Number.isFinite(v) && v >= 0 && v < weeks.length) {
      currentEndWeekIdx = v;
      endLabel.textContent = formatDate(weeks[currentEndWeekIdx]);
      debounced(update, 100);
    }
  });

  modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        const mode = radio.value;
        if (mode !== "spending" && mode !== "credits") throw new Error(`Invalid chart mode: ${mode}`);
        currentMode = mode;
        collapsedPaths.clear();
        if (mode === "credits") {
          currentUnbudgetedOnly = false;
          unbudgetedCheckbox.checked = false;
          unbudgetedToggle.hidden = true;
          currentShowCardPayment = false;
          cardPaymentCheckbox.checked = false;
          cardPaymentToggle.hidden = true;
        } else {
          unbudgetedToggle.hidden = false;
          cardPaymentToggle.hidden = false;
        }
        update();
      }
    });
  });

  unbudgetedCheckbox.addEventListener("change", () => {
    currentUnbudgetedOnly = unbudgetedCheckbox.checked;
    update();
  });

  cardPaymentCheckbox.addEventListener("change", () => {
    currentShowCardPayment = cardPaymentCheckbox.checked;
    update();
  });

  registerAutocompleteListeners();
  categoryFilterInput.addEventListener("focus", () => {
    showDropdown(categoryFilterInput, categoryOptions, "");
  });
  categoryFilterInput.addEventListener("input", () => {
    showDropdown(categoryFilterInput, categoryOptions);
  });
  categoryFilterInput.addEventListener("blur", () => {
    currentCategoryFilter = categoryFilterInput.value;
    update();
  });

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 150);
  });
  observer.observe(container);
}
