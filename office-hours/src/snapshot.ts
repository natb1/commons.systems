/**
 * Reader entry point for the local-snapshot `.benc`: decrypt, then decode.
 *
 * The wire types and the decode spine now live in the shared wire contract
 * (`./snapshot-wire.js`), imported by both this reader and the firebase-admin
 * producer so there is a single serialize↔decode shape. This file adds only the
 * reader-specific decrypt step: `decrypt` lives in crypto.ts, which pulls a
 * browser Worker via `@commons-systems/crypto` and must NOT enter the producer's
 * load graph — so it stays here, out of the shared module.
 */
import { decrypt } from "./crypto.js";
import { decodeSnapshot } from "./snapshot-wire.js";
import type { PanelData } from "./panel-equality.js";

export {
  decodeSnapshot,
  reviveTimestamps,
  SnapshotValidationError,
  type OfficeHoursSnapshot,
  type OfficeHoursSnapshotV1,
} from "./snapshot-wire.js";

/**
 * Decrypts encrypted snapshot bytes with `password`, then decodes them into
 * PanelData + a `computedAt` staleness stamp.
 */
export async function loadSnapshotPanelData(
  bytes: ArrayBuffer,
  password: string,
): Promise<{ data: PanelData; computedAt: Date }> {
  return decodeSnapshot(await decrypt(bytes, password));
}
