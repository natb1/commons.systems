import type { User } from "firebase/auth";
import { escapeHtml } from "../escape-html.js";

export function renderNav(user: User | null, currentPath: string): string {
  const isAdmin = currentPath === "/admin";
  let authHtml = "";
  if (isAdmin) {
    authHtml = user
      ? `<span id="user-display">${escapeHtml(user.displayName ?? user.email ?? "User")}</span>
         <a href="#" id="sign-out">Logout</a>`
      : `<a href="#" id="sign-in">Login</a>`;
  }
  return `
    <a href="#/">Home</a>
    ${authHtml ? `<span style="margin-left: auto">${authHtml}</span>` : ""}
  `;
}
