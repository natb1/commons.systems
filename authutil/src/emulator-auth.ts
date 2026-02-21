import { connectAuthEmulator, signInWithCustomToken } from "firebase/auth";
import type { Auth } from "firebase/auth";

/**
 * Build a fake Firebase custom token JWT for the emulator.
 * The emulator accepts custom tokens without validating signatures,
 * so this creates a minimal JWT that identifies the target user by UID.
 */
export function fakeCustomToken(uid: string): string {
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

/**
 * Connect to the auth emulator and expose a `window.__signIn(uid)` helper
 * for Playwright tests. Playwright can't interact with the emulator's
 * redirect account picker, so tests sign in programmatically using a
 * custom token that the emulator accepts without signature validation.
 */
export function setupAuthEmulator(auth: Auth, emulatorHost: string): void {
  connectAuthEmulator(auth, `http://${emulatorHost}`, {
    disableWarnings: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__signIn = (uid: string) =>
    signInWithCustomToken(auth, fakeCustomToken(uid));
}
