export const firebaseConfig = {
  projectId: "commons-systems",
  apiKey: "AIzaSyCeT2nQbB_RCtu2Ybt9D3828okcodri4wc",
  authDomain:
    typeof location !== "undefined" && !location.hostname.includes("--")
      ? location.hostname
      : "commons-systems.firebaseapp.com",
  storageBucket: "commons-systems.firebasestorage.app",
};
