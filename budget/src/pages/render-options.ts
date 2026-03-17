import type { User } from "firebase/auth";
import type { Group } from "@commons-systems/authutil/groups";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

export type RenderPageOptions =
  | { user: null; group: null; groupError: false }
  | { user: User; group: Group; groupError: false }
  | { user: User; group: null; groupError: boolean };

/**
 * Build the auth/seed notice HTML shown above page content.
 * Returns groupErrorNotice + seedNotice concatenated.
 */
export function renderPageNotices(options: RenderPageOptions, entityLabel: string): string {
  const { user, group, groupError } = options;
  const authorized = group !== null;

  const groupErrorNotice = groupError && user
    ? '<p id="group-error" class="auth-error">Could not load group data. Showing example data. Try refreshing the page.</p>'
    : "";

  let seedNotice = "";
  if (!authorized && !groupError) {
    seedNotice = user
      ? '<p id="seed-data-notice">Viewing example data. You are not a member of any groups.</p>'
      : `<p id="seed-data-notice">Viewing example data. Sign in to see your ${entityLabel}.</p>`;
  }

  return `${groupErrorNotice}${seedNotice}`;
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
