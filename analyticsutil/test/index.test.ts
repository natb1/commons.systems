import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { FirebaseApp } from "firebase/app";
import { registerErrorSink, type ErrorSink } from "@commons-systems/errorutil/log";

vi.mock("firebase/analytics", () => ({
  initializeAnalytics: vi.fn(() => ({ app: {} })),
  logEvent: vi.fn(),
  setUserProperties: vi.fn(),
}));

vi.mock("web-vitals", () => ({
  onLCP: vi.fn(),
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

import { initializeAnalytics, logEvent, setUserProperties } from "firebase/analytics";
import { onLCP, onCLS, onINP, onFCP, onTTFB } from "web-vitals";
import {
  initAnalytics,
  initAnalyticsSafe,
  __resetWebVitalsRegistrationForTest,
} from "../src/index";

beforeEach(() => {
  vi.resetAllMocks();
  __resetWebVitalsRegistrationForTest();
});

afterEach(() => {
  // Restore any spies (e.g. console.error) created in test bodies so a thrown
  // assertion before an inline restore cannot leak a mock into later tests.
  vi.restoreAllMocks();
  // Clear the module-level error sink so a test that does not register its own
  // sink cannot observe a previous test's stale vi.fn().
  registerErrorSink(undefined);
});

describe("initAnalytics", () => {
  it("returns no-op tracker and logs debug when measurementId is missing", () => {
    const consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const app = { options: {} } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    tracker("/some-page");

    expect(consoleDebugSpy).toHaveBeenCalledWith(
      "Analytics disabled: measurementId not set.",
    );
    expect(initializeAnalytics).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();

    consoleDebugSpy.mockRestore();
  });

  it("throws when appId is missing", () => {
    const app = { options: { measurementId: "G-TEST" } } as unknown as FirebaseApp;

    expect(() => initAnalytics(app)).toThrow(
      "Analytics requires appId in Firebase config.",
    );
    expect(initializeAnalytics).not.toHaveBeenCalled();
  });

  it("calls initializeAnalytics with send_page_view: false", () => {
    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;
    initAnalytics(app);

    expect(initializeAnalytics).toHaveBeenCalledWith(app, {
      config: { send_page_view: false },
    });
  });

  it("returned tracker calls logEvent with page_view and page_path", () => {
    const fakeAnalytics = { app: {} };
    vi.mocked(initializeAnalytics).mockReturnValue(fakeAnalytics as never);

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    tracker("/about");

    expect(logEvent).toHaveBeenCalledWith(fakeAnalytics, "page_view", {
      page_path: "/about",
    });
  });

  it("propagates error when initializeAnalytics throws", () => {
    vi.mocked(initializeAnalytics).mockImplementation(() => {
      throw new Error("CSP blocked");
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;

    expect(() => initAnalytics(app)).toThrow("CSP blocked");
  });

  it("reports error when logEvent throws", () => {
    const sink: ErrorSink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(initializeAnalytics).mockReturnValue({ app: {} } as never);
    const badStateError = new Error("bad state");
    vi.mocked(logEvent).mockImplementation(() => {
      throw badStateError;
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    expect(() => tracker("/about")).not.toThrow();
    const reported = (vi.mocked(sink).mock.calls[0][0] as Error);
    expect(reported.message).toBe(
      "Failed to log page view (path: /about): bad state",
    );
    expect(sink).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ operation: "analytics-page-view" }));
  });

  it("re-throws TypeError from logEvent", () => {
    vi.mocked(initializeAnalytics).mockReturnValue({ app: {} } as never);
    vi.mocked(logEvent).mockImplementation(() => {
      throw new TypeError("invalid argument");
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    expect(() => tracker("/about")).toThrow(TypeError);
  });
});

describe("traffic tagging", () => {
  const validApp = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;

  function setLocation(url: string) {
    Object.defineProperty(window, "location", {
      value: new URL(url),
      writable: true,
      configurable: true,
    });
  }

  beforeEach(() => {
    localStorage.clear();
    setLocation("https://example.com/page");
    vi.spyOn(history, "replaceState").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(history.replaceState).mockRestore();
  });

  it("sets localStorage and tags internal when ?_ct=internal", () => {
    const fakeAnalytics = { app: {} };
    vi.mocked(initializeAnalytics).mockReturnValue(fakeAnalytics as never);
    setLocation("https://example.com/page?_ct=internal");
    initAnalytics(validApp);

    expect(localStorage.getItem("analytics_traffic_type")).toBe("internal");
    expect(setUserProperties).toHaveBeenCalledWith(fakeAnalytics, {
      traffic_type: "internal",
    });
  });

  it("strips _ct param from URL after processing", () => {
    setLocation("https://example.com/page?_ct=internal&other=1");
    vi.mocked(history.replaceState).mockRestore();
    history.replaceState({ sentinel: true }, "");
    vi.spyOn(history, "replaceState").mockImplementation(() => {});
    initAnalytics(validApp);

    expect(history.replaceState).toHaveBeenCalledWith(
      { sentinel: true },
      "",
      "https://example.com/page?other=1",
    );
  });

  it("removes localStorage and tags organic when ?_ct=clear", () => {
    localStorage.setItem("analytics_traffic_type", "internal");
    setLocation("https://example.com/page?_ct=clear");
    initAnalytics(validApp);

    expect(localStorage.getItem("analytics_traffic_type")).toBeNull();
    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), {
      traffic_type: "organic",
    });
  });

  it("tags internal when localStorage flag exists and no param", () => {
    localStorage.setItem("analytics_traffic_type", "internal");
    initAnalytics(validApp);

    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), {
      traffic_type: "internal",
    });
  });

  it("tags organic when no localStorage flag and no param", () => {
    initAnalytics(validApp);

    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), {
      traffic_type: "organic",
    });
  });

  it("does not call applyTrafficTag or setUserProperties when measurementId is absent", () => {
    const app = { options: {} } as unknown as FirebaseApp;
    setLocation("https://example.com/page?_ct=internal");
    const consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    initAnalytics(app);

    expect(setUserProperties).not.toHaveBeenCalled();
    expect(localStorage.getItem("analytics_traffic_type")).toBeNull();
    expect(history.replaceState).not.toHaveBeenCalled();
    consoleDebugSpy.mockRestore();
  });

  it("ignores unknown _ct values and does not strip URL", () => {
    setLocation("https://example.com/page?_ct=typo");
    initAnalytics(validApp);

    expect(localStorage.getItem("analytics_traffic_type")).toBeNull();
    expect(history.replaceState).not.toHaveBeenCalled();
    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), {
      traffic_type: "organic",
    });
  });

  it("re-throws TypeError from applyTrafficTag", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new TypeError("invalid invocation");
    });
    setLocation("https://example.com/page");
    expect(() => initAnalytics(validApp)).toThrow(TypeError);
    vi.mocked(localStorage.getItem).mockRestore();
  });

  it("continues with organic tag when localStorage throws", () => {
    const sink: ErrorSink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});
    setLocation("https://example.com/page?_ct=internal");
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });
    initAnalytics(validApp);

    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), {
      traffic_type: "organic",
    });
    const reported = (vi.mocked(sink).mock.calls[0][0] as Error);
    expect(reported.message).toContain("Failed to apply traffic tag");
    expect(sink).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ operation: "analytics-traffic-tag" }));
  });

  it("calls setUserProperties before returning the tracker", () => {
    const callOrder: string[] = [];
    vi.mocked(initializeAnalytics).mockImplementation(() => {
      callOrder.push("initializeAnalytics");
      return { app: {} } as never;
    });
    vi.mocked(setUserProperties).mockImplementation(() => {
      callOrder.push("setUserProperties");
    });

    const tracker = initAnalytics(validApp);
    callOrder.push("tracker_returned");

    expect(callOrder).toEqual(["initializeAnalytics", "setUserProperties", "tracker_returned"]);
    expect(tracker).toBeTypeOf("function");
  });
});

describe("web-vitals reporting", () => {
  const validApp = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: new URL("https://example.com/page"),
      writable: true,
      configurable: true,
    });
    vi.spyOn(history, "replaceState").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(history.replaceState).mockRestore();
  });

  it("registers onLCP/onCLS/onINP/onFCP/onTTFB callbacks when measurementId is set", () => {
    initAnalytics(validApp);

    expect(onLCP).toHaveBeenCalledTimes(1);
    expect(onCLS).toHaveBeenCalledTimes(1);
    expect(onINP).toHaveBeenCalledTimes(1);
    expect(onFCP).toHaveBeenCalledTimes(1);
    expect(onTTFB).toHaveBeenCalledTimes(1);
  });

  it("does NOT register web-vitals callbacks when measurementId is absent", () => {
    const app = { options: {} } as unknown as FirebaseApp;
    const consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    initAnalytics(app);

    expect(onLCP).not.toHaveBeenCalled();
    expect(onCLS).not.toHaveBeenCalled();
    expect(onINP).not.toHaveBeenCalled();
    expect(onFCP).not.toHaveBeenCalled();
    expect(onTTFB).not.toHaveBeenCalled();
    consoleDebugSpy.mockRestore();
  });

  it("fires logEvent with web_vitals event and correct params when LCP callback is invoked", () => {
    const fakeAnalytics = { app: {} };
    vi.mocked(initializeAnalytics).mockReturnValue(fakeAnalytics as never);

    initAnalytics(validApp);

    const capturedCallback = vi.mocked(onLCP).mock.calls[0][0];
    const fakeMetric = {
      name: "LCP",
      value: 2500,
      rating: "good",
      id: "v4-1234",
    } as unknown as Parameters<typeof capturedCallback>[0];

    capturedCallback(fakeMetric);

    expect(logEvent).toHaveBeenCalledWith(fakeAnalytics, "web_vitals", {
      metric_name: "LCP",
      metric_value: 2500,
      metric_rating: "good",
      metric_id: "v4-1234",
    });
  });

  it("scales CLS value by 1000 and rounds to integer", () => {
    const fakeAnalytics = { app: {} };
    vi.mocked(initializeAnalytics).mockReturnValue(fakeAnalytics as never);

    initAnalytics(validApp);

    const capturedCallback = vi.mocked(onCLS).mock.calls[0][0];
    const fakeMetric = {
      name: "CLS",
      value: 0.123,
      rating: "good",
      id: "v4-5678",
    } as unknown as Parameters<typeof capturedCallback>[0];

    capturedCallback(fakeMetric);

    expect(logEvent).toHaveBeenCalledWith(fakeAnalytics, "web_vitals", {
      metric_name: "CLS",
      metric_value: 123,
      metric_rating: "good",
      metric_id: "v4-5678",
    });
  });

  it("reports non-programmer logEvent error without propagating", () => {
    const sink: ErrorSink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(initializeAnalytics).mockReturnValue({ app: {} } as never);
    const networkError = new Error("network failure");
    vi.mocked(logEvent).mockImplementation(() => {
      throw networkError;
    });

    initAnalytics(validApp);

    const capturedCallback = vi.mocked(onLCP).mock.calls[0][0];
    const fakeMetric = {
      name: "LCP",
      value: 1800,
      rating: "good",
      id: "v4-abc",
    } as unknown as Parameters<typeof capturedCallback>[0];

    expect(() => capturedCallback(fakeMetric)).not.toThrow();
    const reported = (vi.mocked(sink).mock.calls[0][0] as Error);
    expect(reported.message).toBe(
      "Failed to log web-vital (metric: LCP): network failure",
    );
    expect(sink).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ operation: "analytics-web-vitals" }));
  });

  it.each([
    ["TypeError", TypeError],
    ["ReferenceError", ReferenceError],
  ])(
    "re-throws %s from logEvent inside web-vital callback",
    (_name: string, ErrorCtor: new (msg: string) => Error) => {
      vi.mocked(initializeAnalytics).mockReturnValue({ app: {} } as never);
      vi.mocked(logEvent).mockImplementation(() => {
        throw new ErrorCtor("invalid argument");
      });

      initAnalytics(validApp);

      const capturedCallback = vi.mocked(onLCP).mock.calls[0][0];
      const fakeMetric = {
        name: "LCP",
        value: 1800,
        rating: "good",
        id: "v4-abc",
      } as unknown as Parameters<typeof capturedCallback>[0];

      expect(() => capturedCallback(fakeMetric)).toThrow(ErrorCtor);
    },
  );
});

describe("initAnalyticsSafe", () => {
  it("returns no-op and reports error when initializeAnalytics throws", () => {
    const sink: ErrorSink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const cspError = new Error("CSP blocked");
    vi.mocked(initializeAnalytics).mockImplementation(() => {
      throw cspError;
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;
    const tracker = initAnalyticsSafe(app);

    const reported = (vi.mocked(sink).mock.calls[0][0] as Error);
    expect(reported.message).toBe(
      "Failed to initialize analytics (appId: 1:test:web:abc, measurementId: G-TEST): CSP blocked",
    );
    expect(sink).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ operation: "analytics-init" }));

    tracker("/about");
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("re-throws TypeError from initializeAnalytics", () => {
    vi.mocked(initializeAnalytics).mockImplementation(() => {
      throw new TypeError("invalid config");
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;

    expect(() => initAnalyticsSafe(app)).toThrow(TypeError);
  });
});
