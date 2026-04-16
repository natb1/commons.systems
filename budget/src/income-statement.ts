import type { Transaction } from "./firestore.js";
import { computeNetAmount } from "./balance.js";

export interface CategoryLine {
  readonly category: string;
  readonly amount: number;
}

export interface MonthlyIncomeStatement {
  readonly income: CategoryLine[];
  readonly expenses: CategoryLine[];
  readonly totalIncome: number;
  readonly totalExpenses: number;
  readonly netIncome: number;
  /** null when totalIncome is 0 (undefined ratio). */
  readonly savingsRate: number | null;
}

export interface CashFlowSummary {
  readonly operating: number;
  readonly transfers: number;
  readonly netChange: number;
}

export interface PeriodVariance {
  readonly current: number;
  readonly prior: number | null;
  readonly priorVarianceAbs: number | null;
  readonly priorVariancePct: number | null;
  readonly yoY: number | null;
  readonly yoYVarianceAbs: number | null;
  readonly yoYVariancePct: number | null;
}

export interface VarianceRow {
  readonly category: string;
  readonly variance: PeriodVariance;
}

export interface SavingsRateTriplet {
  readonly current: number | null;
  readonly prior: number | null;
  readonly yoY: number | null;
}

export interface CashFlowTriplet {
  readonly current: CashFlowSummary;
  readonly prior: CashFlowSummary;
  readonly yoY: CashFlowSummary;
}

export interface IncomeStatementReport {
  readonly currentLabel: string;
  readonly priorLabel: string;
  readonly yoYLabel: string;
  readonly incomeRows: VarianceRow[];
  readonly expenseRows: VarianceRow[];
  readonly totalIncome: PeriodVariance;
  readonly totalExpenses: PeriodVariance;
  readonly netIncome: PeriodVariance;
  readonly savingsRate: SavingsRateTriplet;
  readonly cashFlow: CashFlowTriplet;
}

export interface YearMonth {
  readonly year: number;
  /** 0-based month index (0 = January). */
  readonly monthIdx0: number;
}

export function topLevelCategory(category: string): string {
  const idx = category.indexOf(":");
  return idx === -1 ? category : category.substring(0, idx);
}

export function isTransferCategory(category: string): boolean {
  return category === "Transfer" || category.startsWith("Transfer:");
}

export function monthRange({ year, monthIdx0 }: YearMonth): { startMs: number; endMs: number } {
  const startMs = Date.UTC(year, monthIdx0, 1);
  const endMs = Date.UTC(year, monthIdx0 + 1, 1);
  return { startMs, endMs };
}

/** The calendar month immediately preceding the month containing `nowMs`. */
export function mostRecentCompleteMonth(nowMs: number): YearMonth {
  const d = new Date(nowMs);
  const year = d.getUTCFullYear();
  const monthIdx0 = d.getUTCMonth();
  if (monthIdx0 === 0) return { year: year - 1, monthIdx0: 11 };
  return { year, monthIdx0: monthIdx0 - 1 };
}

/**
 * The most recent complete calendar month containing at least one transaction.
 * Scans from the end of `mostRecentCompleteMonth(nowMs)` backwards, so the
 * current partial month is never selected. Returns null when no transaction
 * falls at or before that ceiling.
 */
export function mostRecentMonthWithData(
  transactions: readonly Transaction[],
  nowMs: number,
): YearMonth | null {
  const d = new Date(nowMs);
  const ceilingExclusiveMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);

  let latestMs = -Infinity;
  for (const t of transactions) {
    if (!isIncludable(t)) continue;
    const tMs = t.timestamp!.toMillis();
    if (tMs < ceilingExclusiveMs && tMs > latestMs) latestMs = tMs;
  }
  if (latestMs === -Infinity) return null;
  const latest = new Date(latestMs);
  return { year: latest.getUTCFullYear(), monthIdx0: latest.getUTCMonth() };
}

export function priorMonth({ year, monthIdx0 }: YearMonth): YearMonth {
  if (monthIdx0 === 0) return { year: year - 1, monthIdx0: 11 };
  return { year, monthIdx0: monthIdx0 - 1 };
}

export function yearAgoMonth({ year, monthIdx0 }: YearMonth): YearMonth {
  return { year: year - 1, monthIdx0 };
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonthLabel({ year, monthIdx0 }: YearMonth): string {
  return `${MONTH_LABELS[monthIdx0]} ${year}`;
}

/** Transactions valid for inclusion: has a timestamp and is not a non-primary normalized duplicate. */
function isIncludable(t: Transaction): boolean {
  if (t.timestamp === null) return false;
  if (t.normalizedId !== null && !t.normalizedPrimary) return false;
  return true;
}

function netAmount(t: Transaction): number {
  return computeNetAmount(t.amount, t.reimbursement);
}

function compareCategoryDesc(a: CategoryLine, b: CategoryLine): number {
  if (b.amount !== a.amount) return b.amount - a.amount;
  if (a.category < b.category) return -1;
  if (a.category > b.category) return 1;
  return 0;
}

export function computeMonthlyIncomeStatement(
  transactions: Transaction[],
  startMs: number,
  endMs: number,
): MonthlyIncomeStatement {
  const incomeByCategory = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    if (!isIncludable(t)) continue;
    const tMs = t.timestamp!.toMillis();
    if (tMs < startMs || tMs >= endMs) continue;
    if (isTransferCategory(t.category)) continue;

    const net = netAmount(t);
    const top = topLevelCategory(t.category);
    if (net < 0) {
      // Credit / income (flip sign so it's positive in the statement)
      incomeByCategory.set(top, (incomeByCategory.get(top) ?? 0) + (-net));
    } else if (net > 0) {
      expenseByCategory.set(top, (expenseByCategory.get(top) ?? 0) + net);
    }
  }

  const income: CategoryLine[] = [...incomeByCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort(compareCategoryDesc);
  const expenses: CategoryLine[] = [...expenseByCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort(compareCategoryDesc);

  const totalIncome = income.reduce((s, l) => s + l.amount, 0);
  const totalExpenses = expenses.reduce((s, l) => s + l.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome === 0 ? null : netIncome / totalIncome;

  return { income, expenses, totalIncome, totalExpenses, netIncome, savingsRate };
}

export function computeCashFlowSummary(
  transactions: Transaction[],
  startMs: number,
  endMs: number,
): CashFlowSummary {
  let operatingCredits = 0;
  let operatingDebits = 0;
  let transfers = 0;

  for (const t of transactions) {
    if (!isIncludable(t)) continue;
    const tMs = t.timestamp!.toMillis();
    if (tMs < startMs || tMs >= endMs) continue;

    const net = netAmount(t);
    if (isTransferCategory(t.category)) {
      // Flip sign: positive net is spending (leaves accounts), negative is credit (enters).
      transfers += -net;
    } else if (net < 0) {
      operatingCredits += -net;
    } else if (net > 0) {
      operatingDebits += net;
    }
  }

  const operating = operatingCredits - operatingDebits;
  const netChange = operating + transfers;
  return { operating, transfers, netChange };
}

function monthAmount(statement: MonthlyIncomeStatement, side: "income" | "expenses", category: string): number {
  const rows = side === "income" ? statement.income : statement.expenses;
  const found = rows.find((l) => l.category === category);
  return found ? found.amount : 0;
}

function buildVariance(current: number, prior: number | null, yoY: number | null): PeriodVariance {
  const priorVarianceAbs = prior === null ? null : current - prior;
  const priorVariancePct = prior === null || prior === 0 ? null : ((current - prior) / Math.abs(prior)) * 100;
  const yoYVarianceAbs = yoY === null ? null : current - yoY;
  const yoYVariancePct = yoY === null || yoY === 0 ? null : ((current - yoY) / Math.abs(yoY)) * 100;
  return { current, prior, priorVarianceAbs, priorVariancePct, yoY, yoYVarianceAbs, yoYVariancePct };
}

function hasAnyTransactionInMonth(transactions: Transaction[], startMs: number, endMs: number): boolean {
  for (const t of transactions) {
    if (!isIncludable(t)) continue;
    const tMs = t.timestamp!.toMillis();
    if (tMs >= startMs && tMs < endMs) return true;
  }
  return false;
}

export function computeIncomeStatementReport(
  transactions: Transaction[],
  nowMs: number,
): IncomeStatementReport | null {
  const currentMonth = mostRecentMonthWithData(transactions, nowMs);
  if (!currentMonth) return null;
  const priorMo = priorMonth(currentMonth);
  const yoYMo = yearAgoMonth(currentMonth);

  const currentRange = monthRange(currentMonth);
  const priorRange = monthRange(priorMo);
  const yoYRange = monthRange(yoYMo);

  // Only render the report when the current period has data.
  if (!hasAnyTransactionInMonth(transactions, currentRange.startMs, currentRange.endMs)) {
    return null;
  }

  const current = computeMonthlyIncomeStatement(transactions, currentRange.startMs, currentRange.endMs);
  const priorHas = hasAnyTransactionInMonth(transactions, priorRange.startMs, priorRange.endMs);
  const yoYHas = hasAnyTransactionInMonth(transactions, yoYRange.startMs, yoYRange.endMs);
  const prior = priorHas ? computeMonthlyIncomeStatement(transactions, priorRange.startMs, priorRange.endMs) : null;
  const yoY = yoYHas ? computeMonthlyIncomeStatement(transactions, yoYRange.startMs, yoYRange.endMs) : null;

  const currentCash = computeCashFlowSummary(transactions, currentRange.startMs, currentRange.endMs);
  const priorCash = computeCashFlowSummary(transactions, priorRange.startMs, priorRange.endMs);
  const yoYCash = computeCashFlowSummary(transactions, yoYRange.startMs, yoYRange.endMs);

  // Build the union of top-level categories seen in any of the three periods, per side.
  function unionCategories(side: "income" | "expenses"): string[] {
    const s = new Set<string>();
    for (const statement of [current, prior, yoY]) {
      if (!statement) continue;
      const rows = side === "income" ? statement.income : statement.expenses;
      for (const r of rows) s.add(r.category);
    }
    return [...s].sort();
  }

  function buildRows(side: "income" | "expenses"): VarianceRow[] {
    const cats = unionCategories(side);
    const rows = cats.map((category) => {
      const cur = monthAmount(current, side, category);
      const pr = prior === null ? null : monthAmount(prior, side, category);
      const yy = yoY === null ? null : monthAmount(yoY, side, category);
      return { category, variance: buildVariance(cur, pr, yy) };
    });
    // Sort by current amount descending, stable by category name on ties.
    rows.sort((a, b) => {
      if (b.variance.current !== a.variance.current) return b.variance.current - a.variance.current;
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return 0;
    });
    return rows;
  }

  const incomeRows = buildRows("income");
  const expenseRows = buildRows("expenses");

  const totalIncome = buildVariance(current.totalIncome, prior?.totalIncome ?? null, yoY?.totalIncome ?? null);
  const totalExpenses = buildVariance(current.totalExpenses, prior?.totalExpenses ?? null, yoY?.totalExpenses ?? null);
  const netIncome = buildVariance(current.netIncome, prior?.netIncome ?? null, yoY?.netIncome ?? null);

  return {
    currentLabel: formatMonthLabel(currentMonth),
    priorLabel: formatMonthLabel(priorMo),
    yoYLabel: formatMonthLabel(yoYMo),
    incomeRows,
    expenseRows,
    totalIncome,
    totalExpenses,
    netIncome,
    savingsRate: {
      current: current.savingsRate,
      prior: prior?.savingsRate ?? null,
      yoY: yoY?.savingsRate ?? null,
    },
    cashFlow: {
      current: currentCash,
      prior: priorCash,
      yoY: yoYCash,
    },
  };
}
