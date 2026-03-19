import { createAppContext } from "@commons-systems/firebaseutil/app-context";

export const { db, app, NAMESPACE, trackPageView } = createAppContext(
  "landing",
  "1:1043497797028:web:2aa63913a15aa053062d31",
  { recaptchaSiteKey: "6Lfv044sAAAAADtxsrFCfRFer_t7GLf1lG5vmyqN" },
);
