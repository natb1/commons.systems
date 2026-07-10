/**
 * The one error type the snapshot decode + decrypt paths both throw.
 *
 * It lives in its own zero-dependency module so BOTH sides of the wire contract
 * can import it without dragging in anything else: `crypto.ts` (reader-only —
 * `@commons-systems/crypto` pulls a browser `Worker`) uses it for its
 * `validationError` factory, and `snapshot-wire.ts` (loaded by the firebase-admin
 * producer as well as the reader) throws it from `decodeSnapshot`. Co-locating it
 * with either would make that module a load dependency of the other; a standalone
 * class keeps both paths clean.
 */
export class SnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotValidationError";
  }
}
