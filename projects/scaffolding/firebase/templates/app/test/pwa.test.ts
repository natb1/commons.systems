import { describe, it, expect, vi, afterEach } from "vitest";

import {
  autoLoadPersistedHandle,
  setupInstallPrompt,
  type FsaPermissionHandle,
} from "../src/pwa";

function makeHandle(
  query: PermissionState,
  request: PermissionState = "granted",
): { handle: FsaPermissionHandle; queryPermission: ReturnType<typeof vi.fn>; requestPermission: ReturnType<typeof vi.fn> } {
  const queryPermission = vi.fn().mockResolvedValue(query);
  const requestPermission = vi.fn().mockResolvedValue(request);
  return {
    handle: { queryPermission, requestPermission },
    queryPermission,
    requestPermission,
  };
}

describe("autoLoadPersistedHandle", () => {
  it("returns loaded without ever calling requestPermission when granted", async () => {
    const { handle, requestPermission } = makeHandle("granted");

    const result = await autoLoadPersistedHandle(handle);

    expect(result).toEqual({ status: "loaded" });
    // AC3: an installed PWA auto-loads with zero permission prompts.
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("returns needs-permission when in prompt state; request() re-grants", async () => {
    const { handle, requestPermission } = makeHandle("prompt", "granted");

    const result = await autoLoadPersistedHandle(handle, "readwrite");

    expect(result.status).toBe("needs-permission");
    if (result.status !== "needs-permission") return;
    expect(requestPermission).not.toHaveBeenCalled();

    const granted = await result.request();
    expect(granted).toBe(true);
    expect(requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
  });

  it("request() returns false when re-grant is not granted", async () => {
    const { handle } = makeHandle("prompt", "denied");

    const result = await autoLoadPersistedHandle(handle);
    expect(result.status).toBe("needs-permission");
    if (result.status !== "needs-permission") return;

    expect(await result.request()).toBe(false);
  });

  it("returns denied when permission is denied", async () => {
    const { handle, requestPermission } = makeHandle("denied");

    const result = await autoLoadPersistedHandle(handle);

    expect(result).toEqual({ status: "denied" });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("returns unsupported when handle is null", async () => {
    const result = await autoLoadPersistedHandle(null);
    expect(result).toEqual({ status: "unsupported" });
  });
});

interface FakeBeforeInstallPromptEvent extends Event {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function makeBeforeInstallPromptEvent(
  outcome: "accepted" | "dismissed" = "accepted",
): FakeBeforeInstallPromptEvent {
  const event = new Event("beforeinstallprompt") as FakeBeforeInstallPromptEvent;
  // Native beforeinstallprompt events are trusted; setupInstallPrompt ignores
  // untrusted (synthetic) events, so mark this test event trusted.
  Object.defineProperty(event, "isTrusted", { value: true });
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "web" });
  return event;
}

describe("setupInstallPrompt", () => {
  let controllers: { dispose(): void }[] = [];

  afterEach(() => {
    for (const c of controllers) c.dispose();
    controllers = [];
  });

  it("captures beforeinstallprompt, preventing default and enabling install", () => {
    const onChange = vi.fn();
    const controller = setupInstallPrompt(onChange);
    controllers.push(controller);

    expect(controller.canInstall()).toBe(false);

    const event = makeBeforeInstallPromptEvent();
    const preventDefault = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(controller.canInstall()).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ canInstall: true, installed: false });
  });

  it("promptInstall() shows the captured prompt and resolves the outcome", async () => {
    const controller = setupInstallPrompt();
    controllers.push(controller);

    const event = makeBeforeInstallPromptEvent("accepted");
    window.dispatchEvent(event);

    const outcome = await controller.promptInstall();
    expect(event.prompt).toHaveBeenCalled();
    expect(outcome).toBe("accepted");
    // The deferred prompt is single-use.
    expect(controller.canInstall()).toBe(false);
  });

  it("promptInstall() resolves dismissed from the user choice", async () => {
    const controller = setupInstallPrompt();
    controllers.push(controller);

    window.dispatchEvent(makeBeforeInstallPromptEvent("dismissed"));

    expect(await controller.promptInstall()).toBe("dismissed");
  });

  it("promptInstall() resolves unavailable when no prompt was captured", async () => {
    const controller = setupInstallPrompt();
    controllers.push(controller);

    expect(await controller.promptInstall()).toBe("unavailable");
  });

  it("appinstalled flips state to installed and clears canInstall", () => {
    const onChange = vi.fn();
    const controller = setupInstallPrompt(onChange);
    controllers.push(controller);

    window.dispatchEvent(makeBeforeInstallPromptEvent());
    expect(controller.canInstall()).toBe(true);

    window.dispatchEvent(new Event("appinstalled"));

    expect(controller.canInstall()).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith({ canInstall: false, installed: true });
  });

  it("dispose() detaches listeners so later events are ignored", () => {
    const controller = setupInstallPrompt();
    controller.dispose();

    window.dispatchEvent(makeBeforeInstallPromptEvent());

    expect(controller.canInstall()).toBe(false);
  });

  it("a new beforeinstallprompt fired during promptInstall() is not discarded", async () => {
    const controller = setupInstallPrompt();
    controllers.push(controller);

    const firstEvent = makeBeforeInstallPromptEvent("dismissed");
    window.dispatchEvent(firstEvent);

    // Begin the install flow for the first event. The prompt resolves as a
    // microtask, so we can dispatch a second beforeinstallprompt in between.
    const installPromise = controller.promptInstall();

    // Simulate a second beforeinstallprompt arriving while the first is pending.
    const secondEvent = makeBeforeInstallPromptEvent("accepted");
    window.dispatchEvent(secondEvent);

    await installPromise;

    // The second event must survive — the install button should still be available.
    expect(controller.canInstall()).toBe(true);
  });
});
