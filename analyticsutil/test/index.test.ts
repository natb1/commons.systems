import { describe, it, expect, vi } from "vitest";
import type { FirebaseApp } from "firebase/app";

vi.mock("firebase/analytics", () => ({
  initializeAnalytics: vi.fn(() => ({ app: {} })),
  logEvent: vi.fn(),
}));

import { initializeAnalytics, logEvent } from "firebase/analytics";
import { initAnalytics } from "../src/index";

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
});
