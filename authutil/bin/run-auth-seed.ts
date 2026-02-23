import { seedAuthUser, type AuthUser } from "../src/seed.js";

const appName = process.env.APP_NAME;
if (!appName) {
  console.error("APP_NAME env var is required");
  process.exit(1);
}

const host = process.env.AUTH_EMULATOR_HOST;
if (!host) {
  console.error("AUTH_EMULATOR_HOST required");
  process.exit(1);
}

const { default: testUser } = (await import(
  `../../${appName}/seeds/auth.js`
)) as { default: AuthUser };

const projectId = process.env.FIREBASE_PROJECT_ID ?? "commons-systems";

await seedAuthUser(host, testUser, projectId);
console.log(`Auth user seeded: ${testUser.email}`);
