import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { RECAPTCHA_SITE_KEY } from "@commons-systems/firebaseutil/config";

export const { db, NAMESPACE, trackPageView, initAppCheck, signIn, signOut, onAuthStateChanged } = createAppContext(
  "office-hours",
  "1:1043497797028:web:9261a154dcf6b5b4062d31",
  {
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    deferAppCheck: true,
    enableAuth: true,
  },
);
