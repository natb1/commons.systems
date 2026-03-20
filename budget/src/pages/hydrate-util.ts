import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { showDropdown } from "@commons-systems/style/components/autocomplete";

const errorTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/** Show a timed error indicator (save-error class + title) on an element. Auto-clears after 30 seconds. */
function showError(el: HTMLElement, title: string): void {
  const existing = errorTimers.get(el);
  if (existing) clearTimeout(existing);
  el.classList.add("save-error");
  el.title = title;
  errorTimers.set(el, setTimeout(() => {
    el.classList.remove("save-error");
    el.title = "";
    errorTimers.delete(el);
  }, 30000));
}

/**
 * Revert an input/select to its last-saved value, show a visual error indicator,
 * and auto-clear after 30 seconds.
 */
export function showInputError(el: HTMLInputElement | HTMLSelectElement, title = "Save failed \u2014 value reverted"): void {
  if (el instanceof HTMLSelectElement) {
    const saved = el.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved) el.value = saved.value;
  } else {
    el.value = el.defaultValue;
  }
  showError(el, title);
}

/**
 * Classify a save error and show the appropriate input error. Programmer errors
 * (TypeError, ReferenceError) are rethrown asynchronously to surface in devtools.
 */
export function handleSaveError(el: HTMLInputElement | HTMLSelectElement, error: unknown, entity: string): void {
  if (error instanceof TypeError || error instanceof ReferenceError) {
    setTimeout(() => { throw error; }, 0);
    return;
  }
  if (error instanceof DataIntegrityError) {
    console.error("Data integrity error:", error);
    showInputError(el, "Data error \u2014 please reload");
    return;
  }
  console.error(`Failed to save ${entity}:`, error);
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    showInputError(el, "Access denied. Please contact support.");
  } else if (error instanceof RangeError) {
    showInputError(el, "Value out of range");
  } else {
    showInputError(el);
  }
}

/**
 * Show a temporary error indicator on a button or row element.
 * Adds a `save-error` class and title, auto-clears after 30 seconds.
 */
function showActionError(el: HTMLElement, title = "Action failed"): void {
  showError(el, title);
}

/**
 * Classify an action error (button click, etc.) and show the appropriate error.
 * Programmer errors (TypeError, ReferenceError) are rethrown asynchronously.
 */
export function handleActionError(el: HTMLElement, error: unknown, action: string): void {
  if (error instanceof TypeError || error instanceof ReferenceError) {
    setTimeout(() => { throw error; }, 0);
    return;
  }
  if (error instanceof DataIntegrityError) {
    console.error("Data integrity error:", error);
    showActionError(el, "Data error \u2014 please reload");
    return;
  }
  console.error(`Failed to ${action}:`, error);
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    showActionError(el, "Access denied. Please contact support.");
  } else {
    showActionError(el, `${action.charAt(0).toUpperCase() + action.slice(1)} failed`);
  }
}

/**
 * Wire up focus and input listeners for autocomplete on inputs within a container.
 * On focus, shows all options (unfiltered). On input, filters as user types.
 * The getOptionsForInput callback maps each input to its autocomplete options.
 */
export function addAutocompleteListeners(
  container: HTMLElement,
  getOptionsForInput: (input: HTMLInputElement) => string[],
): void {
  container.addEventListener("focus", (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const options = getOptionsForInput(e.target);
    if (options.length > 0) showDropdown(e.target, options, "");
  }, true);

  container.addEventListener("input", (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const options = getOptionsForInput(e.target);
    if (options.length > 0) showDropdown(e.target, options);
  });
}

export function deserializeJSON(raw: string, label: string): unknown {
  try { return JSON.parse(raw); } catch (e) {
    throw new DataIntegrityError(`Invalid ${label}: ${e instanceof Error ? e.message : e}`);
  }
}

export function toISODate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

import type { ChartResult } from "./budgets-chart.js";

export function attachScrollSync(getWrappers: () => HTMLElement[]): { abort: AbortController; syncing: { value: boolean } } {
  const abort = new AbortController();
  const syncing = { value: false };
  const wrappers = getWrappers();
  for (const w of wrappers) {
    w.addEventListener("scroll", () => {
      if (syncing.value) return;
      syncing.value = true;
      try {
        const ratio = w.scrollWidth > 0 ? w.scrollLeft / w.scrollWidth : 0;
        for (const other of wrappers) {
          if (other !== w) other.scrollLeft = ratio * other.scrollWidth;
        }
      } finally {
        syncing.value = false;
      }
    }, { signal: abort.signal });
  }
  return { abort, syncing };
}

export function wireChartDatePicker(
  pickerId: string,
  chartResult: ChartResult,
  getWrappers: () => HTMLElement[],
): void {
  const datePicker = document.getElementById(pickerId) as HTMLInputElement | null;
  if (!datePicker || chartResult.weeks.length === 0) return;

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
    for (const wrapper of getWrappers()) {
      const scrollMax = wrapper.scrollWidth - wrapper.clientWidth;
      const left = weekCount <= 1 ? 0 : Math.round((nearestIdx / (weekCount - 1)) * scrollMax);
      wrapper.scrollTo({ left: Math.max(0, left - wrapper.clientWidth / 2), behavior: "smooth" });
    }
  });
}

export function wireChartResize(
  container: HTMLElement,
  render: () => void,
  getWrappers: () => HTMLElement[],
  errorEls: HTMLElement[],
  reattachScrollSync: () => void,
): void {
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(() => {
    if (!container.isConnected) {
      observer.disconnect();
      return;
    }
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wrappers = getWrappers();
      const scrollRatio = wrappers.length > 0 && wrappers[0].scrollWidth > 0
        ? wrappers[0].scrollLeft / wrappers[0].scrollWidth
        : 1;
      try {
        render();
      } catch (error) {
        const msg = "Chart rendering failed on resize. Try refreshing the page.";
        for (const el of errorEls) el.textContent = msg;
        setTimeout(() => { throw error; }, 0);
        return;
      }
      reattachScrollSync();
      for (const w of getWrappers()) {
        w.scrollLeft = scrollRatio * w.scrollWidth;
      }
    }, 150);
  });
  observer.observe(container);
}

export function uniqueSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => v != null))].sort();
}

/**
 * Parse a JSON-encoded string array from a data attribute.
 * Returns [] when the attribute is absent (unauthorized users).
 * Throws DataIntegrityError for non-empty values that are not valid JSON arrays of strings.
 */
export function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new DataIntegrityError(`Expected a JSON string array, got ${typeof parsed}`);
    }
    if (!parsed.every((item: unknown) => typeof item === "string")) {
      throw new DataIntegrityError("JSON string array contains non-string element");
    }
    return parsed;
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    throw new DataIntegrityError(`Failed to parse JSON string array: ${raw}`);
  }
}
