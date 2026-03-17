import type { DataSource } from "../data-source.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

export interface RenderPageOptions {
  authorized: boolean;
  groupName: string;
  dataSource: DataSource;
}

export function renderPageNotices(options: RenderPageOptions, entityLabel: string): string {
  if (options.authorized) return "";
  return `<p id="seed-data-notice">Viewing example data. Load a data file to see your ${entityLabel}.</p>`;
}

/**
 * Convert a page-level data loading error to user-facing HTML.
 * Rethrows programmer errors (TypeError, ReferenceError), range errors (RangeError), and data integrity errors.
 */
export function renderLoadError(error: unknown, errorId: string): string {
  if (error instanceof RangeError || error instanceof DataIntegrityError
      || error instanceof TypeError || error instanceof ReferenceError) {
    throw error;
  }
  const code = (error as { code?: string })?.code;
  const message = code === "permission-denied"
    ? "Access denied. Please contact support."
    : "Could not load data. Try refreshing the page.";
  return `<p id="${errorId}">${message}</p>`;
}
