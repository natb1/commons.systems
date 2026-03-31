import type { User } from "firebase/auth";

/** Render the nav bar as an HTML string. */
export function renderNav(user: User | null): string {
  const links = [
    '<a href="/">Home</a>',
    '<a href="/about">About</a>',
    '<a href="/notes">Notes</a>',
  ].join("");

  const auth = user
    ? `<span id="user-display">${user.displayName ?? user.email ?? "User"}</span>` +
      `<a href="#" id="sign-out">Logout</a>`
    : `<a href="#" id="sign-in">Login</a>`;

  return `<nav>${links}${auth}</nav>`;
}
