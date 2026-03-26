export type ErrorKind =
  | "programmer"
  | "data-integrity"
  | "permission-denied"
  | "range"
  | "unknown";

/**
 * Classify an error into an {@link ErrorKind} using first-match priority:
 * programmer (TypeError/ReferenceError) > range (RangeError) >
 * data-integrity (error.name === "DataIntegrityError") >
 * permission-denied (error.code === "permission-denied") > unknown.
 *
 * DataIntegrityError is matched by name string to avoid a dependency on
 * the firestoreutil package where it is defined.
 *
 * The "permission-denied" code matches the Firebase error code convention.
 */
export function classifyError(error: unknown): ErrorKind {
  if (error instanceof TypeError || error instanceof ReferenceError) {
    return "programmer";
  }
  if (error instanceof RangeError) {
    return "range";
  }
  if (error instanceof Error && error.name === "DataIntegrityError") {
    return "data-integrity";
  }
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    return "permission-denied";
  }
  return "unknown";
}
