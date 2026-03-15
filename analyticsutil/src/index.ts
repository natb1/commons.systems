import { initializeAnalytics, logEvent } from "firebase/analytics";
import type { FirebaseApp } from "firebase/app";

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
        reportError(
          new Error(`Failed to log page view (path: ${path})`, {
            cause: error,
          }),
        );
      }
    };
  } catch (error) {
    reportError(
      new Error(
        `Failed to initialize analytics (appId: ${app.options.appId}, measurementId: ${app.options.measurementId})`,
        { cause: error },
      ),
    );
    return () => {};
  }
}
