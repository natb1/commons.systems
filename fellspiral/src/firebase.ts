import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { RECAPTCHA_SITE_KEY } from "@commons-systems/firebaseutil/config";

export const { db, app, NAMESPACE, trackPageView, getAppCheckHeaders, initAppCheck, signIn, signOut, onAuthStateChanged } = createAppContext(
  "fellspiral",
  "1:1043497797028:web:2cfda4da88eb9a9e062d31",
  {
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    deferAppCheck: true,
    enableAuth: true,
  },
);
