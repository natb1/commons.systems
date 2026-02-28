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
  const existing = document.querySelector(".auth-error");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "auth-error";
  el.textContent = message;
  el.setAttribute("role", "alert");
  document.body.prepend(el);
  setTimeout(() => el.remove(), 5000);
}

// Handle redirect result on page load (user returning from GitHub OAuth / emulator picker).
// Catch errors to avoid unhandled promise rejection warnings.
getRedirectResult(auth).catch((error) => {
  console.error("Auth redirect error:", error);
  showAuthError("Sign-in could not be completed. Please try again.");
});

const provider = new GithubAuthProvider();

export function signIn(): void {
  // In emulator mode, redirects to the emulator's fake GitHub account picker.
  // In production, redirects to real GitHub OAuth.
  signInWithRedirect(auth, provider).catch((error) => {
    console.error("Sign-in redirect failed:", error);
    showAuthError("Sign-in failed. Please try again.");
    throw error;
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
