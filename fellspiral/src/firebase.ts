import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { getRecaptchaSiteKey } from "@commons-systems/firebaseutil/config";

export const { db, app, NAMESPACE, trackPageView, getAppCheckHeaders, initAppCheck, signIn, signOut, onAuthStateChanged } = createAppContext(
  "fellspiral",
  "1:1043497797028:web:2cfda4da88eb9a9e062d31",
  {
    recaptchaSiteKey: getRecaptchaSiteKey(),
    deferAppCheck: true,
    enableAuth: true,
  },
);
