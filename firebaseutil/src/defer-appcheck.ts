import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";

const INTERACTION_EVENTS = ["scroll", "click", "touchstart", "keydown"] as const;

/**
 * Defer App Check / reCAPTCHA initialization until first user interaction to keep
 * the large reCAPTCHA script completely off the critical path.
 *
 * Registers passive listeners for scroll, click, touchstart, and keydown. On first
 * interaction, calls `initAppCheck()` (if provided) then `afterInit` (if provided).
 */
export function deferAppCheckInit(
  initAppCheck: (() => Promise<void>) | undefined,
  afterInit?: () => void,
): void {
  if (!initAppCheck) return; // undefined when running against emulator (no reCAPTCHA needed)
  const trigger = () => {
    for (const evt of INTERACTION_EVENTS) {
      window.removeEventListener(evt, trigger);
    }
    initAppCheck()
      .then(() => afterInit?.())
      .catch((err) => {
        if (deferProgrammerError(err)) return;
        logError(err, { operation: "deferred-appcheck-init" });
      });
  };
  for (const evt of INTERACTION_EVENTS) {
    window.addEventListener(evt, trigger, { once: true, passive: true });
  }
}
