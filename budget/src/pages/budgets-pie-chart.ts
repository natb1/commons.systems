import { pie, arc, type PieArcDatum } from "d3-shape";
import { scaleOrdinal } from "d3-scale";
import { schemeTableau10 } from "d3-scale-chromatic";
import type { Budget, BudgetPeriod } from "../firestore.js";
import { formatCurrency } from "../format.js";

interface Slice {
  readonly name: string;
  /** Total spending summed across periods; always > 0 (slices with zero or negative totals are excluded). */
  readonly total: number;
}

export function filterPeriodsToWindow(periods: BudgetPeriod[], windowWeeks: number): BudgetPeriod[] {
  const uniqueStarts = new Set<number>();
  for (const p of periods) uniqueStarts.add(p.periodStart.toMillis());
  if (uniqueStarts.size <= windowWeeks) return periods;
  const sorted = [...uniqueStarts].sort((a, b) => a - b);
  const cutoff = sorted.slice(sorted.length - windowWeeks);
  const cutoffSet = new Set(cutoff);
  return periods.filter(p => cutoffSet.has(p.periodStart.toMillis()));
}

export function aggregateByBudget(budgets: Budget[], periods: BudgetPeriod[]): Slice[] {
  const totals = new Map<string, number>();
  for (const p of periods) {
    totals.set(p.budgetId, (totals.get(p.budgetId) ?? 0) + p.total);
  }
  const slices: Slice[] = [];
  for (const b of budgets) {
    const total = totals.get(b.id) ?? 0;
    if (total > 0) slices.push({ name: b.name, total });
  }
  return slices;
}

export function renderBudgetPieChart(
  container: HTMLElement,
  options: { budgets: Budget[]; periods: BudgetPeriod[]; windowWeeks: number },
): void {
  if (!Number.isFinite(options.windowWeeks) || options.windowWeeks < 1 || !Number.isInteger(options.windowWeeks))
    throw new RangeError(`windowWeeks must be a positive integer, got ${options.windowWeeks}`);

  const filtered = filterPeriodsToWindow(options.periods, options.windowWeeks);
  const slices = aggregateByBudget(options.budgets, filtered);

  if (slices.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No spending data";
    container.replaceChildren(msg);
    return;
  }

  const grandTotal = slices.reduce((s, d) => s + d.total, 0);
  const color = scaleOrdinal<string>().domain(slices.map(s => s.name)).range(schemeTableau10);

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
  svg.setAttribute("aria-label", "Budget spending pie chart");

  const pcts = arcs.map(a => ((a.data.total / grandTotal) * 100).toFixed(1));

  for (let i = 0; i < arcs.length; i++) {
    const a = arcs[i];
    const path = document.createElementNS(ns, "path");
    const d = arcGen(a);
    if (d === null) throw new Error(`arc generator returned null for budget "${a.data.name}"`);
    path.setAttribute("d", d);
    path.setAttribute("fill", color(a.data.name));
    const title = document.createElementNS(ns, "title");
    title.textContent = `${a.data.name}: ${formatCurrency(a.data.total)} (${pcts[i]}%)`;
    path.appendChild(title);
    svg.appendChild(path);
  }

  // Grand total in the donut hole
  const text = document.createElementNS(ns, "text");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("fill", "currentColor");
  text.setAttribute("font-size", "14");
  text.textContent = formatCurrency(grandTotal);
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
    swatch.style.backgroundColor = color(a.data.name);

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
  container.replaceChildren(wrapper);
}
