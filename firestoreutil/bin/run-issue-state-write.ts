import { readFileSync } from "node:fs";
import { initFirebaseAdmin } from "../src/init.js";
import { writeIssueState, validateIssueNumber, type IssueNumber, type IssueState } from "../src/issue-state.js";

const issueArg = process.argv[2];
if (!issueArg) {
  console.error("error: issue number required");
  process.exit(1);
}

let issueNumber: IssueNumber;
try {
  issueNumber = validateIssueNumber(Number(issueArg));
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`error: ${message}`);
  process.exit(1);
}

let jsonInput = process.argv[3] ?? "";
if (!jsonInput) {
  if (process.stdin.isTTY) {
    console.error("error: no JSON state provided (pass as argument or pipe to stdin)");
    process.exit(1);
  }
  jsonInput = readFileSync(0, "utf-8").trim();
}
if (!jsonInput) {
  console.error("error: no JSON state provided");
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(jsonInput);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`error: invalid JSON state: ${message}`);
  process.exit(1);
}

if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
  console.error("error: JSON state must be an object");
  process.exit(1);
}
const state = parsed as IssueState;

try {
  const db = await initFirebaseAdmin();
  await writeIssueState(db, issueNumber, state);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`error: failed to write state for issue #${issueNumber}: ${message}`);
  process.exit(1);
}
