import type { User } from "firebase/auth";
import { logError } from "@commons-systems/errorutil/log";
import { app, registerGetAuth } from "./firebase.js";

async function loadAuth() {
  const [{ createAppAuth }, { getAuth }] = await Promise.all([
    import("@commons-systems/authutil/app-auth"),
    import("firebase/auth"),
  ]);
  registerGetAuth(() => getAuth());
  return createAppAuth(app);
}

const authReady = loadAuth().catch((err) => {
  logError(err, { operation: "auth-chunk-load" });
  throw err;
});

export async function signIn(): Promise<void> {
  (await authReady).signIn();
}

export async function signOut(): Promise<void> {
  await (await authReady).signOut();
}

export async function onAuthStateChanged(
  callback: (user: User | null) => void,
): Promise<() => void> {
  return (await authReady).onAuthStateChanged(callback);
}

export type { User };
