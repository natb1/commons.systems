import { initFirebaseAdmin } from "../src/init.js";
import { readIssueState } from "../src/issue-state.js";

const issueArg = process.argv[2];
if (!issueArg || !/^[1-9][0-9]*$/.test(issueArg)) {
  console.error(
    `error: issue number must be a positive integer, got: '${issueArg ?? ""}'`,
  );
  process.exit(1);
}
const issueNumber = Number(issueArg);

const db = await initFirebaseAdmin();
const state = await readIssueState(db, issueNumber);

if (state === null) {
  console.error(`error: no state found for issue #${issueNumber}`);
  process.exit(1);
}

console.log(JSON.stringify(state, null, 2));
