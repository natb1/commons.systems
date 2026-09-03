import { describeFirebaseHeaders } from "@commons-systems/config/firebase-headers.test-helper";
import { join } from "node:path";

describeFirebaseHeaders("demo", join(import.meta.dirname, "..", ".."));
