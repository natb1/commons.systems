import { getAuth } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { createAppContext } from "@commons-systems/firebaseutil/app-context";
import { RECAPTCHA_SITE_KEY } from "@commons-systems/firebaseutil/config";

export const { db, app, storage, NAMESPACE, STORAGE_NAMESPACE, trackPageView } =
  createAppContext("print", "1:1043497797028:web:0d42d15f6e122e00062d31", {
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    storageModule: { getStorage, connectStorageEmulator },
    getCurrentUser: () => getAuth().currentUser,
  });
