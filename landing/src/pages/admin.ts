import type { User } from "firebase/auth";
import { escapeHtml } from "../escape-html.js";

export function renderAdmin(user: User | null, isAdmin: boolean, skippedCount = 0): string {
  if (!user) {
    return `
      <h2>Admin</h2>
      <p>Sign in with your GitHub account to access admin features.</p>
    `;
  }
  if (!isAdmin) {
    return `
      <h2>Admin</h2>
      <p id="not-authorized">You are not authorized to access admin features.</p>
    `;
  }
  const warning =
    skippedCount > 0
      ? `<p class="warning">Warning: ${skippedCount} post(s) have missing required fields.</p>`
      : "";
  return `
    <h2>Admin</h2>
    ${warning}
    <p>Signed in as <strong>${escapeHtml(user.displayName ?? user.email ?? "Unknown")}</strong>.</p>
  `;
}
