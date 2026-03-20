import { createAppContext } from "@commons-systems/firebaseutil/app-context";

export const { db, app, NAMESPACE, trackPageView, getAppCheckHeaders } = createAppContext(
  "fellspiral",
  "1:1043497797028:web:2cfda4da88eb9a9e062d31",
  { recaptchaSiteKey: "6Lfv044sAAAAADtxsrFCfRFer_t7GLf1lG5vmyqN" },
);
