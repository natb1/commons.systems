import {
  getAuth,
  connectAuthEmulator,
  GithubAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "./firebase.js";

export const auth = getAuth(app);

const authEmulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST;
if (authEmulatorHost) {
  connectAuthEmulator(auth, `http://${authEmulatorHost}`, {
    disableWarnings: true,
  });
  // Exposed only in emulator builds — Playwright tests can't interact with
  // the emulator's redirect account picker, so they sign in programmatically
  (window as Record<string, unknown>).__signIn = (
    email: string,
    password: string,
  ) => signInWithEmailAndPassword(auth, email, password);
}

// Handle redirect result on page load (user returning from GitHub OAuth / emulator picker)
void getRedirectResult(auth);

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
