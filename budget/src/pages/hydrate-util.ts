import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
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
export function showInputError(el: HTMLElement, title = "Save failed \u2014 value reverted"): void {
  if (el instanceof HTMLSelectElement) {
    const saved = el.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved) el.value = saved.value;
  } else if (el instanceof HTMLInputElement) {
    el.value = el.defaultValue;
  }
  showError(el, title);
}

/**
 * Classify a save error and show the appropriate input error. Programmer errors
 * are rethrown asynchronously to surface in devtools.
 */
export function handleSaveError(el: HTMLElement, error: unknown, entity: string): void {
  const kind = classifyError(error);
  if (kind === "programmer") { setTimeout(() => { throw error; }, 0); return; }
  if (kind === "data-integrity") {
    console.error("Data integrity error:", error);
    showInputError(el, "Data error \u2014 please reload");
    return;
  }
  console.error(`Failed to save ${entity}:`, error);
  if (kind === "permission-denied") {
    showInputError(el, "Access denied. Please contact support.");
  } else if (kind === "range") {
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
 * Programmer errors are rethrown asynchronously.
 */
export function handleActionError(el: HTMLElement, error: unknown, action: string): void {
  const kind = classifyError(error);
  if (kind === "programmer") { setTimeout(() => { throw error; }, 0); return; }
  if (kind === "data-integrity") {
    console.error("Data integrity error:", error);
    showActionError(el, "Data error \u2014 please reload");
    return;
  }
  console.error(`Failed to ${action}:`, error);
  if (kind === "permission-denied") {
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

export function attachScrollSync(getWrappers: () => HTMLElement[]): { abort: AbortController } {
  const abort = new AbortController();
  let syncing = false;
  const wrappers = getWrappers();
  for (const w of wrappers) {
    w.addEventListener("scroll", () => {
      if (syncing) return;
      syncing = true;
      try {
        const ratio = w.scrollWidth > 0 ? w.scrollLeft / w.scrollWidth : 0;
        for (const other of wrappers) {
          if (other !== w) other.scrollLeft = ratio * other.scrollWidth;
        }
      } finally {
        syncing = false;
      }
    }, { signal: abort.signal });
  }
  return { abort };
}

/** Find the week timestamp nearest to a target ms value. Weeks must be non-empty. */
export function findNearestWeekMs(weeks: readonly { ms: number }[], targetMs: number): number {
  if (weeks.length === 0) throw new Error("findNearestWeekMs: weeks must not be empty");
  let nearestMs = weeks[0].ms;
  let nearestDist = Infinity;
  for (const w of weeks) {
    const dist = Math.abs(w.ms - targetMs);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestMs = w.ms;
    }
  }
  return nearestMs;
}

export function wireChartDatePicker(
  pickerId: string,
  allWeeks: readonly { label: string; ms: number }[],
  onAnchorChange: (anchorMs: number) => void,
): void {
  const datePicker = document.getElementById(pickerId) as HTMLInputElement | null;
  if (!datePicker || allWeeks.length === 0) return;

  datePicker.min = toISODate(allWeeks[0].ms);
  datePicker.max = toISODate(allWeeks[allWeeks.length - 1].ms);

  datePicker.addEventListener("change", () => {
    if (!datePicker.value) return;
    const selectedMs = new Date(datePicker.value + "T00:00:00Z").getTime();
    const anchorMs = findNearestWeekMs(allWeeks, selectedMs);
    onAnchorChange(anchorMs);
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
      if (!container.isConnected) { observer.disconnect(); return; }
      const wrappers = getWrappers();
      const scrollRatio = wrappers.length > 0 && wrappers[0].scrollWidth > 0
        ? wrappers[0].scrollLeft / wrappers[0].scrollWidth
        : 1;
      try {
        render();
      } catch (error) {
        const msg = "Chart rendering failed on resize. Try refreshing the page.";
        for (const el of errorEls) el.textContent = msg;
        console.error("Chart render failed during resize:", error);
        if (!deferProgrammerError(error)) reportError(error);
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

/** Create a debounced wrapper that delays `fn` by `ms`, resetting the timer on each call. */
export function makeDebounced(): (fn: () => void, ms: number) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (fn, ms) => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
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
