import type { FirebaseApp } from "firebase/app";
import { createFirebaseAuth } from "./firebase-auth.js";

/** Create Firebase auth with GitHub sign-in. Connects to auth emulator when VITE_AUTH_EMULATOR_HOST is set. */
export function createAppAuth(app: FirebaseApp) {
  const emulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST;
  return createFirebaseAuth(app, emulatorHost ? { emulatorHost } : undefined);
}

export type { User } from "firebase/auth";
