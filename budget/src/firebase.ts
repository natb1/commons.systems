import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { RECAPTCHA_SITE_KEY } from "@commons-systems/firebaseutil/config";

export const { db, app, NAMESPACE, trackPageView, initAppCheck } = createAppContext(
  "budget",
  "1:1043497797028:web:d89ca81fba4ee89e062d31",
  {
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    deferAppCheck: true,
  },
);
