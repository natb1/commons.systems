import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { getRecaptchaSiteKey } from "@commons-systems/firebaseutil/config";

export const { db, app, NAMESPACE, trackPageView } = createAppContext(
  "demo",
  "1:1043497797028:web:6b06f19d7a332929062d31",
  {
    recaptchaSiteKey: getRecaptchaSiteKey(),
  },
);
