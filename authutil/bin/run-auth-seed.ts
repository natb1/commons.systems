import { seedAuthUser } from "../src/seed.js";
import { helloTestUser } from "../seeds/hello.js";

const host = process.env.AUTH_EMULATOR_HOST;
if (!host) {
  console.error("AUTH_EMULATOR_HOST required");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? "commons-systems";

await seedAuthUser(host, helloTestUser, projectId);
console.log(`Auth user seeded: ${helloTestUser.email}`);
