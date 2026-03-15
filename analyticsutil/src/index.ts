import { initializeAnalytics, logEvent } from "firebase/analytics";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";

export function withMeasurementId<T extends FirebaseOptions>(
  config: T,
  measurementId: string | undefined,
): T {
  if (!measurementId) return config;
  // GA4 measurement IDs use "G-" prefix; reject raw stream/property IDs.
  if (!/^G-/.test(measurementId)) {
    throw new Error(
      `Invalid measurement ID "${measurementId}": must start with "G-".`,
    );
  }
  return { ...config, measurementId };
}

export function initAnalyticsSafe(app: FirebaseApp): (path: string) => void {
  try {
    return initAnalytics(app);
  } catch (error) {
    if (error instanceof TypeError || error instanceof ReferenceError) throw error;
    console.error("Analytics initialization failed:", error);
    return () => {};
  }
}

export function initAnalytics(app: FirebaseApp): (path: string) => void {
  if (!app.options.measurementId) {
    console.debug("Analytics disabled: measurementId not set.");
    return () => {};
  }
  if (!app.options.appId) {
    throw new Error("Analytics requires appId in Firebase config.");
  }
  // Disable automatic page views — the returned tracker fires them manually.
  const analytics = initializeAnalytics(app, {
    config: { send_page_view: false },
  });
  return (path: string) => {
    try {
      logEvent(analytics, "page_view", { page_path: path });
    } catch (error) {
      if (error instanceof TypeError || error instanceof ReferenceError) throw error;
      console.error("Failed to log page view (path: %s):", path, error);
    }
  };
}
