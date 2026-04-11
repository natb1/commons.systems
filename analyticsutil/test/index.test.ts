import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { FirebaseApp } from "firebase/app";

vi.mock("firebase/analytics", () => ({
  initializeAnalytics: vi.fn(() => ({ app: {} })),
  logEvent: vi.fn(),
  setUserProperties: vi.fn(),
}));

import { initializeAnalytics, logEvent, setUserProperties } from "firebase/analytics";
import { initAnalytics, initAnalyticsSafe } from "../src/index";

// reportError is a browser API not available in Node — stub it so tests that
// don't mock it fail loudly rather than silently swallowing errors.
globalThis.reportError ??= (error: unknown) => {
  throw error;
};

beforeEach(() => vi.clearAllMocks());

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
    const reportErrorSpy = vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
    vi.mocked(initializeAnalytics).mockReturnValue({ app: {} } as never);
    const badStateError = new Error("bad state");
    vi.mocked(logEvent).mockImplementation(() => {
      throw badStateError;
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    expect(() => tracker("/about")).not.toThrow();
    const reported = reportErrorSpy.mock.calls[0][0] as Error;
    expect(reported.message).toBe(
      "Failed to log page view (path: /about): bad state",
    );

    reportErrorSpy.mockRestore();
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

  it("continues with organic tag when localStorage throws", () => {
    const reportErrorSpy = vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
    setLocation("https://example.com/page?_ct=internal");
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });
    initAnalytics(validApp);

    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), {
      traffic_type: "organic",
    });
    const reported = reportErrorSpy.mock.calls[0][0] as Error;
    expect(reported.message).toContain("Failed to apply traffic tag");
    reportErrorSpy.mockRestore();
    vi.mocked(localStorage.setItem).mockRestore();
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

describe("initAnalyticsSafe", () => {
  it("returns no-op and reports error when initializeAnalytics throws", () => {
    const reportErrorSpy = vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
    const cspError = new Error("CSP blocked");
    vi.mocked(initializeAnalytics).mockImplementation(() => {
      throw cspError;
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;
    const tracker = initAnalyticsSafe(app);

    const reported = reportErrorSpy.mock.calls[0][0] as Error;
    expect(reported.message).toBe(
      "Failed to initialize analytics (appId: 1:test:web:abc, measurementId: G-TEST): CSP blocked",
    );

    tracker("/about");
    expect(logEvent).not.toHaveBeenCalled();

    reportErrorSpy.mockRestore();
  });

  it("re-throws TypeError from initializeAnalytics", () => {
    vi.mocked(initializeAnalytics).mockImplementation(() => {
      throw new TypeError("invalid config");
    });

    const app = { options: { measurementId: "G-TEST", appId: "1:test:web:abc" } } as unknown as FirebaseApp;

    expect(() => initAnalyticsSafe(app)).toThrow(TypeError);
  });
});
