import { initFirebaseAdmin } from "../src/init.js";
import { readIssueState, validateIssueNumber, type IssueNumber, type IssueState } from "../src/issue-state.js";

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

let state: IssueState | null;
try {
  const db = await initFirebaseAdmin();
  state = await readIssueState(db, issueNumber);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`error: failed to read state for issue #${issueNumber}: ${message}`);
  process.exit(1);
}

if (state === null) {
  console.error(`error: no state found for issue #${issueNumber}`);
  process.exit(1);
}

console.log(JSON.stringify(state, null, 2));
