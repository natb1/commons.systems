import {
  getAuth,
  GithubAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { setupAuthEmulator } from "@commons-systems/authutil/emulator-auth";
import { app } from "./firebase.js";

export const auth = getAuth(app);

const authEmulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST;
if (authEmulatorHost) {
  setupAuthEmulator(auth, authEmulatorHost);
}

function showAuthError(message: string): void {
  const existing = document.querySelector(".auth-toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "auth-toast";
  el.setAttribute("role", "alert");

  const text = document.createElement("span");
  text.textContent = message;
  el.appendChild(text);

  const btn = document.createElement("button");
  btn.textContent = "\u00d7";
  btn.setAttribute("aria-label", "Dismiss error");
  el.appendChild(btn);

  document.body.prepend(el);
  const timer = setTimeout(() => el.remove(), 15000);
  btn.addEventListener("click", () => {
    clearTimeout(timer);
    el.remove();
  });
}

// Handle redirect result on page load (user returning from GitHub OAuth / emulator picker).
// Show a toast on failure and catch to prevent unhandled promise rejection.
getRedirectResult(auth).catch((error) => {
  console.error("Auth redirect error:", error);
  if (error?.code === "auth/popup-closed-by-user") return;
  showAuthError("Sign-in could not be completed. Please try again.");
});

const provider = new GithubAuthProvider();

export function signIn(): void {
  // In emulator mode, redirects to the emulator's fake GitHub account picker.
  // In production, redirects to real GitHub OAuth.
  void signInWithRedirect(auth, provider).catch((error) => {
    console.error("Sign-in redirect failed:", error);
    if (error?.code === "auth/popup-closed-by-user") return;
    showAuthError("Sign-in failed. Please try again.");
  });
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth).catch((error) => {
    console.error("Sign-out failed:", error);
    showAuthError("Sign-out failed. Please try again.");
    throw error;
  });
}

export { onAuthStateChanged };
export type { User } from "firebase/auth";
