import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
} from "../setup.js";

const ENV = "test";
const MEMBERS = ["member@test.com", "other@test.com"];

const basePeriod = {
  budgetId: "budget1",
  periodStart: "2024-01-01",
  periodEnd: "2024-01-31",
  total: 350,
  count: 15,
  categoryBreakdown: { food: 200, transport: 150 },
  groupId: "group1",
  memberEmails: MEMBERS,
};

describe("budget budget-periods", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(
      env,
      `budget/${ENV}/budget-periods/period1`,
      basePeriod,
    );
  });

  describe("read", () => {
    it("allows member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `budget/${ENV}/budget-periods/period1`)),
      );
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/budget-periods/period1`)),
      );
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/budget-periods/period1`)),
      );
    });
  });

  describe("update - total (only mutable field)", () => {
    it("allows updating total", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          total: 400,
        }),
      );
    });

    it("denies non-number total", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          total: "400",
        }),
      );
    });
  });

  describe("update - immutable field violations", () => {
    it("denies changing budgetId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          budgetId: "budget2",
        }),
      );
    });

    it("denies changing periodStart", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          periodStart: "2024-02-01",
        }),
      );
    });

    it("denies changing periodEnd", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          periodEnd: "2024-02-28",
        }),
      );
    });

    it("denies changing groupId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          groupId: "group2",
        }),
      );
    });

    it("denies changing memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies changing count", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          count: 20,
        }),
      );
    });

    it("denies changing categoryBreakdown", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          categoryBreakdown: { food: 300 },
        }),
      );
    });

    it("denies extra fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budget-periods/period1`), {
          extra: "nope",
        }),
      );
    });
  });

  describe("create and delete", () => {
    it("denies create", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(
          doc(db, `budget/${ENV}/budget-periods/period2`),
          basePeriod,
        ),
      );
    });

    it("denies delete", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/budget-periods/period1`)),
      );
    });
  });
});
