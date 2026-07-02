// office-hours local-snapshot producer — CLI entrypoint (thin shim).
//
// All logic lives in run.ts's testable `run(argv, env, io)`. This file is the
// only one with a top-level call, guarded so importing it never self-executes
// (which would kill a test runner). The run is invoked only when this module is
// the process entry (`node .../main.js ...`).

import { pathToFileURL } from "node:url";
import { run } from "./run.js";

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  run(process.argv.slice(2), process.env).then(
    (code) => process.exit(code),
    (err: unknown) => {
      process.stderr.write(
        `office-hours-snapshot: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exit(1);
    },
  );
}
