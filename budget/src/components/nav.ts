import type { User } from "firebase/auth";
import type { Group } from "@commons-systems/authutil/groups";
import { escapeHtml } from "../escape-html.js";

function renderGroupSelect(groups: readonly Group[], selectedGroupId: string | null): string {
  if (groups.length === 0) return "";
  const options = groups
    .map((g) => {
      const selected = g.id === selectedGroupId ? " selected" : "";
      return `<option value="${escapeHtml(g.id)}"${selected}>${escapeHtml(g.name)}</option>`;
    })
    .join("");
  return `<select id="group-select" aria-label="Select group">${options}</select>`;
}

export function renderNav(
  user: User | null,
  groups: readonly Group[] = [],
  selectedGroupId: string | null = null,
): string {
  const authHtml = user
    ? `<span id="user-display">${escapeHtml(user.displayName ?? user.email ?? "User")}</span>
       <a href="#" id="sign-out">Logout</a>`
    : `<a href="#" id="sign-in">Login</a>`;
  const groupSelect = user ? renderGroupSelect(groups, selectedGroupId) : "";
  return `
    <a href="#/">Home</a>
    <a href="#/about">About</a>
    ${groupSelect}
    <span class="nav-auth">${authHtml}</span>
  `;
}
