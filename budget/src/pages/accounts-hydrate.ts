import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { renderAggregateTrendChart } from "./budgets-trend-chart.js";
import { renderNetWorthChart } from "./accounts-net-worth-chart.js";
import type { AggregatePoint, NetWorthPoint } from "../balance.js";
import type { ChartResult } from "./budgets-chart.js";

const ACCOUNTS_PANEL_WIDTH = 40;

function deserializeJSON(raw: string, label: string): unknown {
  try { return JSON.parse(raw); } catch (e) {
    throw new DataIntegrityError(`Invalid ${label}: ${e instanceof Error ? e.message : e}`);
  }
}

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

let scrollSyncing = false;
let scrollAbort: AbortController | null = null;
function attachScrollSync(): void {
  if (scrollAbort) scrollAbort.abort();
  scrollAbort = new AbortController();
  const wrappers = getAccountsScrollWrappers();
  for (const w of wrappers) {
    w.addEventListener("scroll", () => {
      if (scrollSyncing) return;
      scrollSyncing = true;
      try {
        const ratio = w.scrollWidth > 0 ? w.scrollLeft / w.scrollWidth : 0;
        for (const other of wrappers) {
          if (other !== w) other.scrollLeft = ratio * other.scrollWidth;
        }
      } finally {
        scrollSyncing = false;
      }
    }, { signal: scrollAbort.signal });
  }
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
    chartResult = renderAggregateTrendChart(trendEl, { data: aggregateTrend, containerWidth, panelWidth: ACCOUNTS_PANEL_WIDTH });
    renderNetWorthChart(nwEl, { data: netWorthData, containerWidth, panelWidth: ACCOUNTS_PANEL_WIDTH });
  }

  render();
  attachScrollSync();

  // Date picker
  const datePicker = document.getElementById("accounts-date-picker") as HTMLInputElement | null;
  if (datePicker && chartResult.weeks.length > 0) {
    datePicker.min = toISODate(chartResult.weeks[0].ms);
    datePicker.max = toISODate(chartResult.weeks[chartResult.weeks.length - 1].ms);

    datePicker.addEventListener("change", () => {
      if (!datePicker.value) return;
      const weeks = chartResult.weeks;
      const selectedMs = new Date(datePicker.value + "T00:00:00").getTime();
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < weeks.length; i++) {
        const dist = Math.abs(weeks[i].ms - selectedMs);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
      const weekCount = weeks.length;
      if (weekCount === 0) return;
      for (const wrapper of getAccountsScrollWrappers()) {
        const scrollMax = wrapper.scrollWidth - wrapper.clientWidth;
        const left = weekCount <= 1 ? 0 : Math.round((nearestIdx / (weekCount - 1)) * scrollMax);
        wrapper.scrollTo({ left: Math.max(0, left - wrapper.clientWidth / 2), behavior: "smooth" });
      }
    });
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(() => {
    if (!container.isConnected) {
      observer.disconnect();
      return;
    }
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wrappers = getAccountsScrollWrappers();
      const scrollRatio = wrappers.length > 0 && wrappers[0].scrollWidth > 0
        ? wrappers[0].scrollLeft / wrappers[0].scrollWidth
        : 1;
      try {
        render();
      } catch (error) {
        const msg = "Chart rendering failed on resize. Try refreshing the page.";
        trendEl.textContent = msg;
        nwEl.textContent = msg;
        setTimeout(() => { throw error; }, 0);
        return;
      }
      attachScrollSync();
      for (const w of getAccountsScrollWrappers()) {
        w.scrollLeft = scrollRatio * w.scrollWidth;
      }
    }, 150);
  });
  observer.observe(container);
}

function toISODate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
