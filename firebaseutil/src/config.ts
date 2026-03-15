import type { FirebaseOptions } from "firebase/app";

export const firebaseConfig = {
  projectId: "commons-systems",
  apiKey: "AIzaSyCeT2nQbB_RCtu2Ybt9D3828okcodri4wc",
  authDomain:
    // Preview channel hostnames contain "--" (e.g., "pr-42--site.web.app") and must
    // use the default firebaseapp.com domain since auth cookies are scoped to the project.
    typeof location !== "undefined" && !location.hostname.includes("--")
      ? location.hostname
      : "commons-systems.firebaseapp.com",
  storageBucket: "commons-systems.firebasestorage.app",
} satisfies FirebaseOptions;
