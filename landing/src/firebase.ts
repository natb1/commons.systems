import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { RECAPTCHA_SITE_KEY } from "@commons-systems/firebaseutil/config";

export const { db, app, NAMESPACE, trackPageView, initAppCheck, signIn, signOut, onAuthStateChanged } = createAppContext(
  "landing",
  "1:1043497797028:web:2aa63913a15aa053062d31",
  {
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    deferAppCheck: true,
    enableAuth: true,
  },
);
