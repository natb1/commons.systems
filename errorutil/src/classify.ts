export type ErrorKind =
  | "programmer"
  | "data-integrity"
  | "permission-denied"
  | "range"
  | "unknown";

export interface ClassifiedError {
  kind: ErrorKind;
  original: Error;
}

export function classifyError(error: unknown): ClassifiedError {
  const original = error instanceof Error ? error : new Error(String(error));

  if (error instanceof TypeError || error instanceof ReferenceError) {
    return { kind: "programmer", original };
  }
  if (error instanceof RangeError) {
    return { kind: "range", original };
  }
  if (original.name === "DataIntegrityError") {
    return { kind: "data-integrity", original };
  }
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    return { kind: "permission-denied", original };
  }
  return { kind: "unknown", original };
}
