import type { User } from "firebase/auth";
import { escapeHtml } from "../escape-html.js";

function isNatb1(user: User): boolean {
  const screenName = (
    user as unknown as { reloadUserInfo?: { screenName?: string } }
  ).reloadUserInfo?.screenName;
  if (screenName === "natb1") return true;
  return user.providerData.some((p) => p.uid === "natb1");
}

export function renderAdmin(user: User | null): string {
  if (!user) {
    return `
      <h2>Admin</h2>
      <p>Sign in with your GitHub account to access admin features.</p>
    `;
  }
  if (!isNatb1(user)) {
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
