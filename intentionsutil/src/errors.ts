export class IntentionSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntentionSchemaError";
  }
}
