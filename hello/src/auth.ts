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

// Handle redirect result on page load (user returning from GitHub OAuth / emulator picker).
// Catch errors to prevent unhandled rejections from blocking app initialization.
getRedirectResult(auth).catch((error) => {
  if (error?.code !== "auth/popup-closed-by-user") {
    console.error("Auth redirect error:", error);
  }
});

const provider = new GithubAuthProvider();

export function signIn(): void {
  // In emulator mode, redirects to the emulator's fake GitHub account picker.
  // In production, redirects to real GitHub OAuth.
  signInWithRedirect(auth, provider).catch((error) => {
    console.error("Sign-in redirect failed:", error);
  });
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth).catch((error) => {
    console.error("Sign-out failed:", error);
    throw error;
  });
}

export { onAuthStateChanged };
export type { User } from "firebase/auth";
