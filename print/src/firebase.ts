import { createAppContext } from "@commons-systems/firebaseutil/app-context";

export const { db, app, storage, NAMESPACE, STORAGE_NAMESPACE, trackPageView } =
  createAppContext("print", "1:1043497797028:web:0d42d15f6e122e00062d31", {
    storage: true,
  });
