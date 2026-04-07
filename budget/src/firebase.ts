import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { RECAPTCHA_SITE_KEY } from "@commons-systems/firebaseutil/config";

let cachedGetAuth: (() => import("firebase/auth").Auth) | undefined;

/** Lazy getCurrentUser: returns null until firebase/auth has been loaded by auth.ts.
 *  Provided to the error-logging configuration in createAppContext. */
const getCurrentUser = (): { uid: string; email: string | null } | null => {
  const user = cachedGetAuth?.().currentUser ?? null;
  return user ? { uid: user.uid, email: user.email } : null;
};

/** Called by auth.ts after firebase/auth is loaded to enable getCurrentUser. */
export function registerGetAuth(getAuth: () => import("firebase/auth").Auth): void {
  if (cachedGetAuth) throw new Error("registerGetAuth called more than once");
  cachedGetAuth = getAuth;
}

export const { db, app, NAMESPACE, trackPageView, getAppCheckHeaders, initAppCheck } = createAppContext(
  "budget",
  "1:1043497797028:web:d89ca81fba4ee89e062d31",
  {
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    deferAppCheck: true,
    getCurrentUser,
  },
);
