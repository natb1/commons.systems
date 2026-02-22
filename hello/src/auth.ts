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
getRedirectResult(auth).catch(() => {});

const provider = new GithubAuthProvider();

export function signIn(): void {
  // In emulator mode, redirects to the emulator's fake GitHub account picker.
  // In production, redirects to real GitHub OAuth.
  void signInWithRedirect(auth, provider);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { User } from "firebase/auth";
