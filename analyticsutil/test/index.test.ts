import { describe, it, expect, beforeEach, vi } from "vitest";
import type { FirebaseApp } from "firebase/app";

vi.mock("firebase/analytics", () => ({
  initializeAnalytics: vi.fn(() => ({ app: {} })),
  logEvent: vi.fn(),
}));

import { initializeAnalytics, logEvent } from "firebase/analytics";
import { initAnalytics, initAnalyticsSafe, withMeasurementId } from "../src/index";

// reportError is a browser API not available in Node — stub it so tests that
// don't mock it fail loudly rather than silently swallowing errors.
globalThis.reportError ??= (error: unknown) => {
  throw error;
};

beforeEach(() => vi.clearAllMocks());

describe("withMeasurementId", () => {
  it("adds measurementId when present", () => {
    const config = { apiKey: "test" };
    const result = withMeasurementId(config, "G-TEST");
    expect(result).toEqual({ apiKey: "test", measurementId: "G-TEST" });
  });

  it("returns config unchanged when measurementId is undefined", () => {
    const config = { apiKey: "test" };
    const result = withMeasurementId(config, undefined);
    expect(result).toBe(config);
  });

  it("returns config unchanged when measurementId is empty string", () => {
    const config = { apiKey: "test" };
    const result = withMeasurementId(config, "");
    expect(result).toBe(config);
  });

  it("throws when measurementId does not start with G-", () => {
    const config = { apiKey: "test" };
    expect(() => withMeasurementId(config, "13891425074")).toThrow(
      'Invalid measurement ID "13891425074": must start with "G-".',
    );
  });
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
    expect(reported.message).toBe("Failed to log page view (path: /about)");
    expect(reported.cause).toBe(badStateError);

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
      "Failed to initialize analytics (appId: 1:test:web:abc, measurementId: G-TEST)",
    );
    expect(reported.cause).toBe(cspError);

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
