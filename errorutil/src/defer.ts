import { classifyError } from "./classify.js";

/**
 * If the error is a programmer error (as classified by classifyError), defer
 * it as an uncaught exception via setTimeout so it surfaces in devtools.
 *
 * Errors are deferred rather than rethrown because call sites are inside catch
 * blocks where rethrowing would be swallowed by the surrounding handler or
 * reject a void-discarded promise.
 *
 * Returns true if the error was deferred (caller should return early), false
 * otherwise.
 */
export function deferProgrammerError(error: unknown): boolean {
  if (classifyError(error) === "programmer") {
    setTimeout(() => {
      throw error;
    }, 0);
    return true;
  }
  return false;
}
