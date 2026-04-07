import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { RECAPTCHA_SITE_KEY } from "@commons-systems/firebaseutil/config";

let cachedGetAuth: (() => import("firebase/auth").Auth) | undefined;

/** Returns null until firebase/auth has been loaded by auth.ts.
 *  Passed to createAppContext so the Firestore error sink can attach user identity. */
const getCurrentUser = (): { uid: string; email: string | null } | null => {
  try {
    const user = cachedGetAuth?.().currentUser ?? null;
    return user ? { uid: user.uid, email: user.email } : null;
  } catch {
    return null;
  }
};

export function registerGetAuth(getAuth: () => import("firebase/auth").Auth): void {
  if (cachedGetAuth) throw new Error("registerGetAuth called more than once");
  cachedGetAuth = getAuth;
}

export const { db, app, NAMESPACE, trackPageView, initAppCheck } = createAppContext(
  "budget",
  "1:1043497797028:web:d89ca81fba4ee89e062d31",
  {
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    deferAppCheck: true,
    getCurrentUser,
  },
);
