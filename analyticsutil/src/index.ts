import { initializeAnalytics, logEvent } from "firebase/analytics";
import type { FirebaseApp } from "firebase/app";

export function initAnalyticsSafe(app: FirebaseApp): (path: string) => void {
  try {
    return initAnalytics(app);
  } catch (error) {
    if (error instanceof TypeError || error instanceof ReferenceError) throw error;
    reportError(
      new Error(
        `Failed to initialize analytics (appId: ${app.options.appId}, measurementId: ${app.options.measurementId}): ${error instanceof Error ? error.message : error}`,
      ),
    );
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
      reportError(
        new Error(
          `Failed to log page view (path: ${path}): ${error instanceof Error ? error.message : error}`,
        ),
      );
    }
  };
}
