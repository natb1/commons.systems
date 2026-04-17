import * as Plot from "@observablehq/plot";
import { scaleOrdinal } from "d3-scale";
import { schemeTableau10 } from "d3-scale-chromatic";
import { isFavorableDiff, type CategoryActualRow, type VarianceWindow } from "../balance.js";
import { formatCurrency } from "../format.js";
import { readThemeVar } from "./chart-util.js";

const ALLOWANCE_LABEL = "Allowance";
const ACTUAL_LABEL = "Actual";
const OTHER_LABEL = "Other";

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
  readonly categories: readonly [CategoryActualRow, ...CategoryActualRow[]];
}

/**
 * Build the bar sequence for a bridge chart: an `Allowance` bar from 0 to
 * `weeklyAllowance`, one `category` bar per input row tracking the running
 * balance (a positive `avgWeekly` steps down, a refund's negative `avgWeekly`
 * steps up), and a trailing `Actual` bar re-anchored to 0 so the viewer can
 * compare its height against the Allowance bar directly rather than against
 * the final running-total endpoint.
 */
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
    const label = cat.kind === "other" ? OTHER_LABEL : cat.category;
    bars.push({
      label,
      y1: running,
      y2: next,
      kind: "category",
      amount: cat.avgWeekly,
    });
    running = next;
  }

  const totalActual = opts.weeklyAllowance - running;
  bars.push({
    label: ACTUAL_LABEL,
    y1: 0,
    y2: totalActual,
    kind: "actual",
    amount: totalActual,
  });

  return bars;
}

export function renderVarianceWaterfall(container: HTMLElement, options: WaterfallOptions, windowSize: VarianceWindow): void {
  const bars = buildWaterfallBars(options);
  const totalActual = bars[bars.length - 1].amount;
  const favorable = isFavorableDiff(options.weeklyAllowance - totalActual);

  const style = getComputedStyle(container);
  const fg = readThemeVar(container, "--fg", style);
  const favorableColor = readThemeVar(container, "--favorable", style);
  const unfavorableColor = readThemeVar(container, "--unfavorable", style);
  const categoryNames = options.categories.map(c => c.kind === "other" ? OTHER_LABEL : c.category);
  const categoryColor = scaleOrdinal<string, string>()
    .domain(categoryNames)
    .range(schemeTableau10);

  function fillFor(bar: WaterfallBar): string {
    if (bar.kind === "allowance") return fg;
    if (bar.kind === "actual") return favorable ? favorableColor : unfavorableColor;
    return categoryColor(bar.label);
  }

  const width = container.clientWidth;
  if (width === 0) {
    throw new Error("renderVarianceWaterfall: container.clientWidth is zero");
  }
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
    ariaLabel: `Variance waterfall, ${windowSize}-week window`,
  });

  container.replaceChildren(svg);
}
