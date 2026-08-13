import type { PlanRow } from "./model.js";

export interface FilterState {
  tiers: number[];
  labels: string[];
  query: string;
}

export const EMPTY_FILTER: FilterState = { tiers: [], labels: [], query: "" };

/**
 * Apply the active filter to the row set.
 *
 * Filtering changes WHICH rows are shown, and therefore what the hot-lineage
 * panel reports. It must never change a row's ETA: the ETA is the router's
 * absolute position over the whole queue, and hiding rows does not make the
 * router arrive sooner. That asymmetry is intended — the panel deliberately
 * does the opposite — so this function returns a SUBSET of the rows exactly as
 * built, never recomputed ones.
 *
 * Tiers and labels are OR within a group, AND across groups; an empty group is
 * inert rather than exclusive.
 */
export function applyFilter(rows: PlanRow[], filter: FilterState): PlanRow[] {
  const query = filter.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter.tiers.length > 0 && !filter.tiers.includes(row.tier)) return false;
    if (filter.labels.length > 0 && !filter.labels.some((l) => row.labels.includes(l))) {
      return false;
    }
    if (query !== "" && !`${row.id} ${row.statement}`.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });
}

/** Toggle a value in a multi-select filter group. */
export function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export interface SpanRun {
  value: string;
  start: number;
  length: number;
}

/**
 * Contiguous runs of an equal spine value down the rendered row set — the
 * extents the table renders as `rowSpan`.
 *
 * A `rowSpan` must know its extent at render time. That is satisfiable here
 * ONLY because the table renders its full row set rather than virtualizing: the
 * whole column is in hand before the first cell is emitted. When row
 * virtualization arrives with the DS table primitive
 * (`tactic-ds-plan-table-primitive`), spans exceeding the loaded window must
 * become STICKY HEADERS instead — a span that mutates as rows stream causes
 * layout thrash, and one that breaks at a page boundary shows a pagination
 * artifact as data.
 *
 * Contiguity holds on the VALUE, not on the ancestor node, so distinct
 * ancestors that happen to be adjacent do not merge, and equal ones fragment
 * wherever the ordering separates them. Both are expected.
 */
export function spanRuns(values: (string | undefined)[]): SpanRun[] {
  const runs: SpanRun[] = [];
  let index = 0;
  while (index < values.length) {
    const value = values[index];
    if (value === undefined) {
      index += 1;
      continue;
    }
    let length = 1;
    while (index + length < values.length && values[index + length] === value) length += 1;
    runs.push({ value, start: index, length });
    index += length;
  }
  return runs;
}
