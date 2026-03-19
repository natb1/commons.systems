import { getStorage, connectStorageEmulator } from "firebase/storage";
import { createAppContext } from "@commons-systems/firebaseutil/app-context";

export const { db, app, storage, NAMESPACE, STORAGE_NAMESPACE, trackPageView } =
  createAppContext("print", "1:1043497797028:web:0d42d15f6e122e00062d31", {
    recaptchaSiteKey: "6Lfv044sAAAAADtxsrFCfRFer_t7GLf1lG5vmyqN",
    storageModule: { getStorage, connectStorageEmulator },
  });
