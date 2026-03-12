import { DataIntegrityError } from "../errors.js";

const errorTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/**
 * Revert an input/select to its last-saved value, show a visual error indicator,
 * and auto-clear after 30 seconds.
 */
export function showInputError(el: HTMLInputElement | HTMLSelectElement, title = "Save failed \u2014 value reverted"): void {
  const existing = errorTimers.get(el);
  if (existing) clearTimeout(existing);
  if (el instanceof HTMLSelectElement) {
    const saved = el.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved) el.value = saved.value;
  } else {
    el.value = el.defaultValue;
  }
  el.classList.add("save-error");
  el.title = title;
  errorTimers.set(el, setTimeout(() => {
    el.classList.remove("save-error");
    el.title = "";
    errorTimers.delete(el);
  }, 30000));
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
export function showActionError(el: HTMLElement, title = "Action failed"): void {
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
 * Parse a JSON-encoded string array from a data attribute.
 * Returns [] when the attribute is absent (unauthorized users).
 * Throws DataIntegrityError for non-empty values that are not valid JSON arrays of strings.
 */
export function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new DataIntegrityError(`Autocomplete options is not an array: ${typeof parsed}`);
    }
    if (!parsed.every((item: unknown) => typeof item === "string")) {
      throw new DataIntegrityError("Autocomplete options contains non-string element");
    }
    return parsed;
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    throw new DataIntegrityError(`Failed to parse autocomplete options: ${raw}`);
  }
}
