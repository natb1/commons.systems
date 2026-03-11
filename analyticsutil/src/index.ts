import { initializeAnalytics, logEvent, type Analytics } from "firebase/analytics";
import type { FirebaseApp } from "firebase/app";

export function initAnalytics(app: FirebaseApp): (path: string) => void {
  if (!app.options.measurementId) return () => {};
  const analytics: Analytics = initializeAnalytics(app, {
    config: { send_page_view: false },
  });
  return (path: string) =>
    logEvent(analytics, "page_view", { page_path: path });
}
