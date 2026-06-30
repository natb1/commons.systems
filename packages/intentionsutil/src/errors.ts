export class IntentionSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntentionSchemaError";
  }
}

/**
 * Concatenate a thrown `gh`/`execFileSync` error's stderr and stdout into a
 * single searchable text blob (newline-joined). The fields are typed `unknown`
 * and coerced with `String(... ?? "")` because the shape of a child-process
 * throw is not statically known. Shared by backfill.ts and refresh.ts, whose
 * gh-error catch blocks both inspect this text to classify the failure.
 */
export function ghErrorText(err: unknown): string {
  const e = err as { stderr?: unknown; stdout?: unknown };
  return String(e.stderr ?? "") + "\n" + String(e.stdout ?? "");
}
