import type { DataSource } from "../data-source.js";
import { classifyError } from "@commons-systems/errorutil/classify";

export interface RenderPageOptions {
  authorized: boolean;
  groupName: string;
  dataSource: DataSource;
}

export function renderPageNotices(options: { authorized: boolean }, entityLabel: string): string {
  if (options.authorized) return "";
  return `<p id="seed-data-notice">Viewing example data. Load a data file to see your ${entityLabel}.</p>`;
}

/**
 * Convert a page-level data loading error to user-facing HTML.
 * Rethrows programmer, range, and data integrity errors so they propagate
 * to the router's top-level handler.
 */
export function renderLoadError(error: unknown, errorId: string): string {
  const kind = classifyError(error);
  if (kind === "programmer" || kind === "data-integrity" || kind === "range") throw error;
  const message = kind === "permission-denied"
    ? "Access denied. Please contact support."
    : "Could not load data. Try refreshing the page.";
  return `<p id="${errorId}">${message}</p>`;
}
