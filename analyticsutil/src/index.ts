import {
  initializeAnalytics,
  logEvent,
  setUserProperties,
  type Analytics,
} from "firebase/analytics";
import type { FirebaseApp } from "firebase/app";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import { onLCP, onCLS, onINP, onFCP, onTTFB, type Metric } from "web-vitals";

const STORAGE_KEY = "analytics_traffic_type";
const PARAM_KEY = "_ct";

/**
 * CLS is a unitless score in [0, 1] with sub-integer precision (e.g. 0.123).
 * GA4 stores event params as integers in some report/BigQuery surfaces, which
 * would truncate small CLS values to 0 and lose all signal. We multiply by this
 * factor and round so the value survives as an integer (0.123 -> 123). To
 * recover the original CLS in reports or BigQuery, divide metric_value by
 * CLS_SCALE.
 */
const CLS_SCALE = 1000;

// Guards against stacking duplicate web-vitals observers. web-vitals provides
// no cross-call deduplication, so each reportWebVitals call registers its own
// set of observers; a repeated initAnalytics (e.g. hot-module reload) would
// otherwise emit one `web_vitals` event per registration and inflate GA4 counts.
let webVitalsRegistered = false;

/**
 * Test-only: resets the module-scope web-vitals registration guard so each test
 * starts from a clean slate. Not part of the public runtime API.
 */
export function __resetWebVitalsRegistrationForTest(): void {
  webVitalsRegistered = false;
}

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

function reportWebVitals(analytics: Analytics): void {
  if (webVitalsRegistered) return;
  webVitalsRegistered = true;

  function report(metric: Metric): void {
    const metricValue = Math.round(
      metric.name === "CLS" ? metric.value * CLS_SCALE : metric.value,
    );
    try {
      logEvent(analytics, "web_vitals", {
        metric_name: metric.name,
        metric_value: metricValue,
        metric_rating: metric.rating,
        metric_id: metric.id,
      });
    } catch (error) {
      if (classifyError(error) === "programmer") throw error;
      logError(
        new Error(
          `Failed to log web-vital (metric: ${metric.name}): ${error instanceof Error ? error.message : error}`,
        ),
        { operation: "analytics-web-vitals" },
      );
    }
  }

  onLCP(report);
  onCLS(report);
  onINP(report);
  onFCP(report);
  onTTFB(report);
}

export function initAnalyticsSafe(app: FirebaseApp): (path: string) => void {
  try {
    return initAnalytics(app);
  } catch (error) {
    if (classifyError(error) === "programmer") throw error;
    logError(
      new Error(
        `Failed to initialize analytics (appId: ${app.options.appId}, measurementId: ${app.options.measurementId}): ${error instanceof Error ? error.message : error}`,
      ),
      { operation: "analytics-init" },
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
    logError(
      new Error(
        `Failed to apply traffic tag: ${error instanceof Error ? error.message : error}`,
      ),
      { operation: "analytics-traffic-tag" },
    );
  }

  // Disable automatic page views — the returned tracker fires them manually.
  const analytics = initializeAnalytics(app, {
    config: { send_page_view: false },
  });

  setUserProperties(analytics, { traffic_type: trafficType });

  reportWebVitals(analytics);

  return (path: string) => {
    try {
      logEvent(analytics, "page_view", { page_path: path });
    } catch (error) {
      if (classifyError(error) === "programmer") throw error;
      logError(
        new Error(
          `Failed to log page view (path: ${path}): ${error instanceof Error ? error.message : error}`,
        ),
        { operation: "analytics-page-view" },
      );
    }
  };
}
