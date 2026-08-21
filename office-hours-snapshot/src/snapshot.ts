// Producer-side view of the office-hours local-snapshot wire contract.
//
// The wire types and the serialize/decode pair now live in the SHARED module
// `../../office-hours/src/snapshot-wire.ts`, imported by both this producer and
// the reader dashboard so there is a single on-disk shape (no more drift between
// a producer write shape and a reader read shape). This file re-exports that
// contract so existing producer imports of `./snapshot.js` keep resolving.
export * from "../../office-hours/src/snapshot-wire.js";
