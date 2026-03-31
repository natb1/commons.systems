import { initFirebaseAdmin } from "../src/init.js";
import { readIssueState, validateIssueNumber } from "../src/issue-state.js";

const issueArg = process.argv[2];
if (!issueArg || !/^[1-9][0-9]*$/.test(issueArg)) {
  console.error(
    `error: issue number must be a positive integer, got: '${issueArg ?? ""}'`,
  );
  process.exit(1);
}
const issueNumber = validateIssueNumber(Number(issueArg));

let state: Record<string, unknown> | null;
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
