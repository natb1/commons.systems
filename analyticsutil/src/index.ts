import {
  initializeAnalytics,
  logEvent,
  setUserProperties,
} from "firebase/analytics";
import type { FirebaseApp } from "firebase/app";
import { classifyError } from "@commons-systems/errorutil/classify";

const STORAGE_KEY = "analytics_traffic_type";
const PARAM_KEY = "_ct";

type TrafficType = "internal" | "organic";

/**
 * Reads the `_ct` ("classify traffic") URL parameter and updates the persistent
 * traffic-type flag in localStorage.
 *
 * - `?_ct=internal` sets the flag (one-time visit from any team browser)
 * - `?_ct=clear` removes the flag (escape hatch)
 * - Unknown values are ignored and left in the URL for debugging
 *
 * Recognized values are stripped via `replaceState` so the param is not
 * re-applied on refresh and does not leak into GA4 `page_path` dimensions.
 *
 * @returns `"internal"` if the flag is set, `"organic"` otherwise — used as the
 *   `traffic_type` GA4 user property.
 */
function applyTrafficTag(): TrafficType {
  const url = new URL(window.location.href);
  const param = url.searchParams.get(PARAM_KEY);

  if (param === "internal") {
    localStorage.setItem(STORAGE_KEY, "internal");
  } else if (param === "clear") {
    localStorage.removeItem(STORAGE_KEY);
  }

  if (param === "internal" || param === "clear") {
    url.searchParams.delete(PARAM_KEY);
    history.replaceState(history.state, "", url.toString());
  }

  return localStorage.getItem(STORAGE_KEY) === "internal"
    ? "internal"
    : "organic";
}

export function initAnalyticsSafe(app: FirebaseApp): (path: string) => void {
  try {
    return initAnalytics(app);
  } catch (error) {
    if (classifyError(error) === "programmer") throw error;
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

  let trafficType: TrafficType = "organic";
  try {
    trafficType = applyTrafficTag();
  } catch (error) {
    if (classifyError(error) === "programmer") throw error;
    reportError(
      new Error(
        `Failed to apply traffic tag: ${error instanceof Error ? error.message : error}`,
      ),
    );
  }

  // Disable automatic page views — the returned tracker fires them manually.
  const analytics = initializeAnalytics(app, {
    config: { send_page_view: false },
  });

  setUserProperties(analytics, { traffic_type: trafficType });

  return (path: string) => {
    try {
      logEvent(analytics, "page_view", { page_path: path });
    } catch (error) {
      if (classifyError(error) === "programmer") throw error;
      reportError(
        new Error(
          `Failed to log page view (path: ${path}): ${error instanceof Error ? error.message : error}`,
        ),
      );
    }
  };
}
