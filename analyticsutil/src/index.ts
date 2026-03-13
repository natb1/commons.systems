import { initializeAnalytics, logEvent } from "firebase/analytics";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";

export function withMeasurementId<T extends FirebaseOptions>(
  config: T,
  measurementId: string | undefined,
): T {
  if (!measurementId) return config;
  if (!/^G-/.test(measurementId)) {
    throw new Error(
      `Invalid measurement ID "${measurementId}": must start with "G-".`,
    );
  }
  return { ...config, measurementId };
}

export function initAnalytics(app: FirebaseApp): (path: string) => void {
  if (!app.options.measurementId) {
    console.debug("Analytics disabled: measurementId not set.");
    return () => {};
  }
  if (!app.options.appId) {
    throw new Error("Analytics requires appId in Firebase config.");
  }
  try {
    // Disable automatic page views — the returned tracker fires them manually.
    const analytics = initializeAnalytics(app, {
      config: { send_page_view: false },
    });
    return (path: string) => {
      try {
        logEvent(analytics, "page_view", { page_path: path });
      } catch (error) {
        console.error("Failed to log page view (path: %s):", path, error);
      }
    };
  } catch (error) {
    console.error(
      "Failed to initialize analytics (appId: %s, measurementId: %s):",
      app.options.appId,
      app.options.measurementId,
      error,
    );
    return () => {};
  }
}
