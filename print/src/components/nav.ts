import type { User } from "firebase/auth";
import { escapeHtml } from "../escape-html.js";

export function renderNav(user: User | null, _currentPath: string): string {
  const authHtml = user
    ? `<span id="user-display">${escapeHtml(user.displayName ?? user.email ?? "User")}</span>
         <a href="#" id="sign-out">Logout</a>`
    : `<a href="#" id="sign-in">Login</a>`;
  return `
    <a href="#/">Library</a>
    <span style="margin-left: auto">${authHtml}</span>
  `;
}
