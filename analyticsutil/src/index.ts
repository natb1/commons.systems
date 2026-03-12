import { initializeAnalytics, logEvent } from "firebase/analytics";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";

export function withMeasurementId(
  config: FirebaseOptions,
  measurementId: string | undefined,
): FirebaseOptions {
  return measurementId ? { ...config, measurementId } : config;
}

export function initAnalytics(app: FirebaseApp): (path: string) => void {
  if (!app.options.measurementId) return () => {};
  try {
    // Disable automatic page views — the returned tracker fires them manually.
    const analytics = initializeAnalytics(app, {
      config: { send_page_view: false },
    });
    return (path: string) => {
      try {
        logEvent(analytics, "page_view", { page_path: path });
      } catch (error) {
        console.error("Failed to log page view:", error);
      }
    };
  } catch (error) {
    console.error("Failed to initialize analytics:", error);
    return () => {};
  }
}
