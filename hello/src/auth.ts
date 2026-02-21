import {
  getAuth,
  connectAuthEmulator,
  GithubAuthProvider,
  signInWithRedirect,
  signInWithCustomToken,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "./firebase.js";

export const auth = getAuth(app);

// Build a fake Firebase custom token JWT for the emulator.
// The emulator accepts custom tokens without validating signatures,
// so this creates a minimal JWT that identifies the target user by UID.
function fakeCustomToken(uid: string): string {
  const b64 = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const header = b64({ alg: "RS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = b64({
    iss: "firebase-auth-emulator@example.com",
    sub: "firebase-auth-emulator@example.com",
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat: now,
    exp: now + 3600,
    uid,
  });
  return `${header}.${payload}.fakesig`;
}

const authEmulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST;
if (authEmulatorHost) {
  connectAuthEmulator(auth, `http://${authEmulatorHost}`, {
    disableWarnings: true,
  });
  // Exposed only in emulator builds — Playwright tests can't interact with
  // the emulator's redirect account picker, so they sign in programmatically
  // using a custom token that the emulator accepts without signature validation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__signIn = (uid: string) =>
    signInWithCustomToken(auth, fakeCustomToken(uid));
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
