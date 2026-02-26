import type { User } from "firebase/auth";
import { escapeHtml } from "../escape-html.js";
import { isAuthorized } from "../is-authorized.js";

export function renderAdmin(user: User | null): string {
  if (!user) {
    return `
      <h2>Admin</h2>
      <p>Sign in with your GitHub account to access admin features.</p>
    `;
  }
  if (!isAuthorized(user)) {
    return `
      <h2>Admin</h2>
      <p id="not-authorized">You are not authorized to access admin features.</p>
    `;
  }
  return `
    <h2>Admin</h2>
    <p>Signed in as <strong>${escapeHtml(user.displayName ?? "natb1")}</strong>.</p>
  `;
}
