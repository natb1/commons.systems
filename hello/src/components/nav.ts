import type { User } from "firebase/auth";

export function renderNav(user: User | null): string {
  const auth = user
    ? `<span id="user-display">${user.displayName ?? user.email ?? "User"}</span>
       <a href="#" id="sign-out">Logout</a>`
    : `<a href="#" id="sign-in">Login</a>`;
  return `
    <a href="#/">Home</a>
    <a href="#/about">About</a>
    <a href="#/notes">Notes</a>
    ${auth}
  `;
}
