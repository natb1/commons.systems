/**
 * If the error is a TypeError or ReferenceError, defer it as an uncaught
 * exception via setTimeout so it surfaces in devtools. Returns true if the
 * error was deferred (caller should return early), false otherwise.
 */
export function deferProgrammerError(error: unknown): boolean {
  if (error instanceof TypeError || error instanceof ReferenceError) {
    setTimeout(() => {
      throw error;
    }, 0);
    return true;
  }
  return false;
}
