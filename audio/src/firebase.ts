import { getStorage, connectStorageEmulator } from "firebase/storage";
import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { getRecaptchaSiteKey } from "@commons-systems/firebaseutil/config";

export const { db, app, storage, NAMESPACE, STORAGE_NAMESPACE, trackPageView } =
  createAppContext("audio", "1:1043497797028:web:0020fff1515aedec062d31", {
    recaptchaSiteKey: getRecaptchaSiteKey(),
    storageModule: { getStorage, connectStorageEmulator },
  });
