import { readFileSync } from "node:fs";
import { initFirebaseAdmin } from "../src/init.js";
import { writeIssueState } from "../src/issue-state.js";

const issueArg = process.argv[2];
if (!issueArg || !/^[1-9][0-9]*$/.test(issueArg)) {
  console.error(
    `error: issue number must be a positive integer, got: '${issueArg ?? ""}'`,
  );
  process.exit(1);
}
const issueNumber = Number(issueArg);

let jsonInput = process.argv[3] ?? "";
if (!jsonInput) {
  jsonInput = readFileSync(0, "utf-8").trim();
}
if (!jsonInput) {
  console.error("error: no JSON state provided");
  process.exit(1);
}

let state: Record<string, unknown>;
try {
  state = JSON.parse(jsonInput) as Record<string, unknown>;
} catch {
  console.error("error: invalid JSON state");
  process.exit(1);
}

const db = await initFirebaseAdmin();
await writeIssueState(db, issueNumber, state);
