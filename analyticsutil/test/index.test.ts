import { describe, it, expect, beforeEach, vi } from "vitest";
import type { FirebaseApp } from "firebase/app";

vi.mock("firebase/analytics", () => ({
  initializeAnalytics: vi.fn(() => ({ app: {} })),
  logEvent: vi.fn(),
}));

import { initializeAnalytics, logEvent } from "firebase/analytics";
import { initAnalytics, withMeasurementId } from "../src/index";

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
});

describe("initAnalytics", () => {
  it("returns no-op tracker when measurementId is missing", () => {
    const app = { options: {} } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    tracker("/some-page");

    expect(initializeAnalytics).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("calls initializeAnalytics with send_page_view: false", () => {
    const app = { options: { measurementId: "G-TEST" } } as unknown as FirebaseApp;
    initAnalytics(app);

    expect(initializeAnalytics).toHaveBeenCalledWith(app, {
      config: { send_page_view: false },
    });
  });

  it("returned tracker calls logEvent with page_view and page_path", () => {
    const fakeAnalytics = { app: {} };
    vi.mocked(initializeAnalytics).mockReturnValue(fakeAnalytics as never);

    const app = { options: { measurementId: "G-TEST" } } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    tracker("/about");

    expect(logEvent).toHaveBeenCalledWith(fakeAnalytics, "page_view", {
      page_path: "/about",
    });
  });

  it("returns no-op and logs error when initializeAnalytics throws", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(initializeAnalytics).mockImplementation(() => {
      throw new Error("CSP blocked");
    });

    const app = { options: { measurementId: "G-TEST" } } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to initialize analytics:",
      expect.any(Error),
    );

    tracker("/about");
    expect(logEvent).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("swallows and logs error when logEvent throws", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(initializeAnalytics).mockReturnValue({ app: {} } as never);
    vi.mocked(logEvent).mockImplementation(() => {
      throw new Error("bad state");
    });

    const app = { options: { measurementId: "G-TEST" } } as unknown as FirebaseApp;
    const tracker = initAnalytics(app);

    expect(() => tracker("/about")).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to log page view:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
