import { pie, arc, type PieArcDatum } from "d3-shape";
import { scaleOrdinal } from "d3-scale";
import { schemeTableau10 } from "d3-scale-chromatic";
import type { Budget } from "../firestore.js";
import { formatCurrency } from "../format.js";

const NOT_BUDGETED_LABEL = "Not Budgeted";
const NOT_BUDGETED_COLOR = "#ccc";

interface Slice {
  readonly name: string;
  /** Weekly amount: the budget's weeklyAllowance, or the unbudgeted income remainder. Always > 0. */
  readonly total: number;
}

export interface AllocationResult {
  readonly slices: Slice[];
  /** Amount by which total weekly budgets exceed averageWeeklyIncome; 0 when budgets fit within income. */
  readonly overage: number;
}

/**
 * Splits income into allocation slices. Three regimes:
 * - Under-budget: slices include a "Not Budgeted" remainder, overage is 0
 * - Exact match: no remainder slice, overage is 0
 * - Over-budget: no remainder slice, overage is the excess amount
 */
export function buildAllocationSlices(budgets: Budget[], averageWeeklyIncome: number): AllocationResult {
  const slices: Slice[] = [];
  let totalBudgeted = 0;
  for (const b of budgets) {
    if (b.weeklyAllowance > 0) {
      slices.push({ name: b.name, total: b.weeklyAllowance });
      totalBudgeted += b.weeklyAllowance;
    }
  }
  const overage = Math.max(0, totalBudgeted - averageWeeklyIncome);
  if (totalBudgeted < averageWeeklyIncome) {
    slices.push({ name: NOT_BUDGETED_LABEL, total: averageWeeklyIncome - totalBudgeted });
  }
  return { slices, overage };
}

export function renderBudgetPieChart(
  container: HTMLElement,
  options: { budgets: Budget[]; averageWeeklyIncome: number },
): void {
  if (options.averageWeeklyIncome <= 0) {
    const msg = document.createElement("p");
    msg.textContent = "No income data";
    container.replaceChildren(msg);
    return;
  }

  const { slices, overage } = buildAllocationSlices(options.budgets, options.averageWeeklyIncome);

  const chartTotal = slices.reduce((s, d) => s + d.total, 0);
  const color = scaleOrdinal<string>().domain(slices.map(s => s.name)).range(schemeTableau10);
  const sliceColor = (name: string): string =>
    name === NOT_BUDGETED_LABEL ? NOT_BUDGETED_COLOR : color(name);

  const size = Math.min(300, container.clientWidth || 300);
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.5;

  const pieGen = pie<Slice>().value(d => d.total).sort(null);
  const arcGen = arc<PieArcDatum<Slice>>().innerRadius(innerRadius).outerRadius(outerRadius);
  const arcs = pieGen(slices);

  const ns = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `${-outerRadius} ${-outerRadius} ${size} ${size}`);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Income allocation pie chart");

  const pcts = arcs.map(a => ((a.data.total / chartTotal) * 100).toFixed(1));

  for (let i = 0; i < arcs.length; i++) {
    const a = arcs[i];
    const path = document.createElementNS(ns, "path");
    const d = arcGen(a);
    if (d === null) throw new Error(`arc generator returned null for budget "${a.data.name}"`);
    path.setAttribute("d", d);
    path.setAttribute("fill", sliceColor(a.data.name));
    const title = document.createElementNS(ns, "title");
    title.textContent = `${a.data.name}: ${formatCurrency(a.data.total)} (${pcts[i]}%)`;
    path.appendChild(title);
    svg.appendChild(path);
  }

  // Show averageWeeklyIncome (not chartTotal) so the donut hole reflects actual income
  const text = document.createElementNS(ns, "text");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("fill", "currentColor");
  text.setAttribute("font-size", "14");
  text.textContent = formatCurrency(options.averageWeeklyIncome);
  svg.appendChild(text);

  // Legend
  const legend = document.createElement("div");
  legend.className = "pie-legend";
  for (let i = 0; i < arcs.length; i++) {
    const a = arcs[i];
    const item = document.createElement("div");
    item.className = "pie-legend-item";

    const swatch = document.createElement("span");
    swatch.className = "pie-legend-swatch";
    swatch.style.backgroundColor = sliceColor(a.data.name);

    const label = document.createElement("span");
    label.textContent = `${a.data.name} (${pcts[i]}%)`;

    item.appendChild(swatch);
    item.appendChild(label);
    legend.appendChild(item);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "pie-chart-wrapper";
  wrapper.appendChild(svg);
  wrapper.appendChild(legend);

  if (overage > 0) {
    const warning = document.createElement("p");
    warning.className = "pie-overage-warning";
    warning.textContent = `Budgets exceed income by ${formatCurrency(overage)}/week`;
    container.replaceChildren(warning, wrapper);
  } else {
    container.replaceChildren(wrapper);
  }
}
