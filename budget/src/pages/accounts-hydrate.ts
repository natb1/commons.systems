import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { renderAggregateTrendChart } from "./budgets-trend-chart.js";
import { renderNetWorthChart } from "./accounts-net-worth-chart.js";
import { deserializeJSON, attachScrollSync, wireChartDatePicker, wireChartResize } from "./hydrate-util.js";
import type { AggregatePoint, NetWorthPoint } from "../balance.js";
import type { ChartResult } from "./budgets-chart.js";

const ACCOUNTS_POINT_WIDTH = 40;

function deserializeAggregateTrend(raw: string): AggregatePoint[] {
  const parsed = deserializeJSON(raw, "aggregate trend data");
  if (!Array.isArray(parsed)) throw new DataIntegrityError("Aggregate trend data is not an array");
  for (let i = 0; i < parsed.length; i++) {
    const el = parsed[i];
    if (typeof el.weekLabel !== "string" || typeof el.weekMs !== "number"
      || typeof el.avg12Income !== "number" || typeof el.avg12Spending !== "number"
      || typeof el.avg3Spending !== "number" || typeof el.avg12NetIncome !== "number") {
      throw new DataIntegrityError(`Aggregate trend element ${i} missing or invalid fields`);
    }
  }
  return parsed as AggregatePoint[];
}

function deserializeNetWorth(raw: string): NetWorthPoint[] {
  const parsed = deserializeJSON(raw, "net worth data");
  if (!Array.isArray(parsed)) throw new DataIntegrityError("Net worth data is not an array");
  for (let i = 0; i < parsed.length; i++) {
    const el = parsed[i];
    if (typeof el.weekLabel !== "string" || typeof el.weekMs !== "number"
      || typeof el.netWorth !== "number") {
      throw new DataIntegrityError(`Net worth element ${i} missing or invalid fields`);
    }
  }
  return parsed as NetWorthPoint[];
}

function getAccountsScrollWrappers(): HTMLElement[] {
  const trendEl = document.getElementById("accounts-trend-chart");
  const nwEl = document.getElementById("accounts-net-worth-chart");
  const wrappers: HTMLElement[] = [];
  for (const el of [trendEl, nwEl]) {
    if (!el) continue;
    const w = el.querySelector<HTMLElement>(".chart-scroll-wrapper");
    if (w) wrappers.push(w);
  }
  return wrappers;
}

let scrollAbort: AbortController | null = null;
function reattachScrollSync(): void {
  if (scrollAbort) scrollAbort.abort();
  const result = attachScrollSync(getAccountsScrollWrappers);
  scrollAbort = result.abort;
}

export function hydrateAccountsCharts(container: HTMLElement): void {
  const trendElOrNull = document.getElementById("accounts-trend-chart");
  if (!trendElOrNull) throw new DataIntegrityError("accounts-trend-chart container not found");
  const trendEl: HTMLElement = trendElOrNull;
  const nwElOrNull = document.getElementById("accounts-net-worth-chart");
  if (!nwElOrNull) throw new DataIntegrityError("accounts-net-worth-chart container not found");
  const nwEl: HTMLElement = nwElOrNull;

  const aggregateRaw = trendEl.dataset.aggregateTrend;
  if (aggregateRaw === undefined) throw new DataIntegrityError("accounts-trend-chart missing data-aggregate-trend");
  const aggregateTrend = deserializeAggregateTrend(aggregateRaw);

  const nwRaw = nwEl.dataset.netWorth;
  if (nwRaw === undefined) throw new DataIntegrityError("accounts-net-worth-chart missing data-net-worth");
  const netWorthData = deserializeNetWorth(nwRaw);

  let chartResult: ChartResult = { weeks: [] };

  function render(): void {
    const containerWidth = container.clientWidth || 640;
    chartResult = renderAggregateTrendChart(trendEl, { data: aggregateTrend, containerWidth, panelWidth: ACCOUNTS_POINT_WIDTH });
    renderNetWorthChart(nwEl, { data: netWorthData, containerWidth, pointWidth: ACCOUNTS_POINT_WIDTH });
  }

  render();
  reattachScrollSync();
  wireChartDatePicker("accounts-date-picker", () => chartResult, getAccountsScrollWrappers);
  wireChartResize(container, render, getAccountsScrollWrappers, [trendEl, nwEl], reattachScrollSync);
}
