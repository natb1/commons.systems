import * as Plot from "@observablehq/plot";
import { scaleOrdinal } from "d3-scale";
import { schemeTableau10 } from "d3-scale-chromatic";
import type { CategoryVariance } from "../balance.js";
import { formatCurrency } from "../format.js";
import { getThemeFg } from "./chart-util.js";

const ALLOWANCE_LABEL = "Allowance";
const ACTUAL_LABEL = "Actual";
const FAVORABLE_COLOR = "#4caf50";
const UNFAVORABLE_COLOR = "#e45858";

export type WaterfallKind = "allowance" | "category" | "actual";

export interface WaterfallBar {
  readonly label: string;
  readonly y1: number;
  readonly y2: number;
  readonly kind: WaterfallKind;
  readonly amount: number;
}

export interface WaterfallOptions {
  readonly weeklyAllowance: number;
  readonly categories: readonly CategoryVariance[];
  readonly window: 12 | 52;
}

/** Build bridge-chart bars: allowance bar, one running-total bar per category, and a final actual bar. */
export function buildWaterfallBars(opts: WaterfallOptions): WaterfallBar[] {
  const bars: WaterfallBar[] = [];
  bars.push({
    label: ALLOWANCE_LABEL,
    y1: 0,
    y2: opts.weeklyAllowance,
    kind: "allowance",
    amount: opts.weeklyAllowance,
  });

  let running = opts.weeklyAllowance;
  for (const cat of opts.categories) {
    const next = running - cat.avgWeekly;
    bars.push({
      label: cat.category,
      y1: running,
      y2: next,
      kind: "category",
      amount: cat.avgWeekly,
    });
    running = next;
  }

  const totalActual = opts.categories.reduce((s, c) => s + c.avgWeekly, 0);
  bars.push({
    label: ACTUAL_LABEL,
    y1: 0,
    y2: totalActual,
    kind: "actual",
    amount: totalActual,
  });

  return bars;
}

export function renderVarianceWaterfall(container: HTMLElement, options: WaterfallOptions): void {
  const bars = buildWaterfallBars(options);
  const totalActual = options.categories.reduce((s, c) => s + c.avgWeekly, 0);
  const favorable = options.weeklyAllowance >= totalActual;

  const fg = getThemeFg(container);
  const categoryNames = options.categories.map(c => c.category);
  const categoryColor = scaleOrdinal<string, string>()
    .domain(categoryNames)
    .range(schemeTableau10);

  function fillFor(bar: WaterfallBar): string {
    if (bar.kind === "allowance") return fg;
    if (bar.kind === "actual") return favorable ? FAVORABLE_COLOR : UNFAVORABLE_COLOR;
    return categoryColor(bar.label);
  }

  const width = container.clientWidth || 640;
  const height = 240;

  const svg = Plot.plot({
    width,
    height,
    marginBottom: 60,
    marginLeft: 50,
    marginRight: 20,
    style: { background: "transparent", color: fg },
    color: { type: "identity" },
    x: { label: null, tickRotate: -25, domain: bars.map(b => b.label) },
    y: { label: "$/week", grid: true },
    marks: [
      Plot.ruleY([0]),
      Plot.rectY(bars, {
        x: "label",
        y1: "y1",
        y2: "y2",
        fill: (b: WaterfallBar) => fillFor(b),
        fillOpacity: (b: WaterfallBar) => b.kind === "allowance" ? 0.4 : 1,
        inset: 4,
      }),
      Plot.tip(bars, Plot.pointerX({
        x: "label",
        y: (b: WaterfallBar) => b.y2,
        title: (b: WaterfallBar) => `${b.label}\n${formatCurrency(b.amount)}/week`,
      })),
    ],
    ariaLabel: `Variance waterfall, ${options.window}-week window`,
  });

  container.replaceChildren(svg);
}
