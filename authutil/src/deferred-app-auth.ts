import type { FirebaseApp } from "firebase/app";
import type { User } from "firebase/auth";

export interface DeferredAppAuth {
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(cb: (user: User | null) => void): Promise<() => void>;
  getCurrentUser(): { uid: string; email: string | null } | null;
}

/**
 * Creates a deferred auth shim that lazy-loads the auth chunk on first use.
 * The parallel `Promise.all` import preserves concurrent chunk loading.
 * `getCurrentUser` returns null until the auth chunk resolves and a user
 * is signed in — making it safe to call synchronously at any point.
 */
export function createDeferredAppAuth(app: FirebaseApp): DeferredAppAuth {
  let cachedGetAuth: (() => import("firebase/auth").Auth) | undefined;

  const authReady = Promise.all([
    import("./app-auth.js"),
    import("firebase/auth"),
  ]).then(([{ createAppAuth }, { getAuth }]) => {
    cachedGetAuth = () => getAuth(app);
    return createAppAuth(app);
  });

  function getCurrentUser(): { uid: string; email: string | null } | null {
    try {
      const user = cachedGetAuth?.().currentUser ?? null;
      return user ? { uid: user.uid, email: user.email } : null;
    } catch {
      return null;
    }
  }

  async function signIn(): Promise<void> {
    await (await authReady).signIn();
  }

  async function signOut(): Promise<void> {
    await (await authReady).signOut();
  }

  async function onAuthStateChanged(
    cb: (user: User | null) => void,
  ): Promise<() => void> {
    return (await authReady).onAuthStateChanged(cb);
  }

  return { signIn, signOut, onAuthStateChanged, getCurrentUser };
}
