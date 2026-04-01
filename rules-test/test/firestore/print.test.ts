import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  getTestEnv,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
  describeGroupsCollection,
  describeMediaCollection,
} from "../setup.js";

const ENV = "test";

describeMediaCollection("print");
describeGroupsCollection("print");

describe("print reading-position", () => {
  let env: RulesTestEnvironment;
  const UID = "user1";
  const MEDIA_ID = "media1";
  const DOC_ID = `${UID}_${MEDIA_ID}`;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `print/${ENV}/reading-position/${DOC_ID}`, {
      uid: UID,
      mediaId: MEDIA_ID,
      position: 42,
    });
  });

  describe("read", () => {
    it("allows owner to read their position", async () => {
      const ctx = env.authenticatedContext(UID);
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `print/${ENV}/reading-position/${DOC_ID}`)),
      );
    });

    it("allows reading non-existent position (resource == null)", async () => {
      const ctx = env.authenticatedContext(UID);
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(
          doc(db, `print/${ENV}/reading-position/${UID}_nonexistent`),
        ),
      );
    });

    it("denies reading another user's position", async () => {
      const ctx = env.authenticatedContext("other-user");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `print/${ENV}/reading-position/${DOC_ID}`)),
      );
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `print/${ENV}/reading-position/${DOC_ID}`)),
      );
    });
  });

  describe("write", () => {
    it("allows owner to create their position", async () => {
      const newMediaId = "media2";
      const newDocId = `${UID}_${newMediaId}`;
      const ctx = env.authenticatedContext(UID);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `print/${ENV}/reading-position/${newDocId}`), {
          uid: UID,
          mediaId: newMediaId,
          position: 0,
        }),
      );
    });

    it("allows owner to update their position", async () => {
      const ctx = env.authenticatedContext(UID);
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `print/${ENV}/reading-position/${DOC_ID}`), {
          position: 100,
        }),
      );
    });

    it("denies write with wrong uid in data", async () => {
      const ctx = env.authenticatedContext(UID);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `print/${ENV}/reading-position/${DOC_ID}`), {
          uid: "wrong-uid",
          mediaId: MEDIA_ID,
          position: 0,
        }),
      );
    });

    it("denies write with mismatched docId", async () => {
      const ctx = env.authenticatedContext(UID);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `print/${ENV}/reading-position/wrong_doc`), {
          uid: UID,
          mediaId: MEDIA_ID,
          position: 0,
        }),
      );
    });

    it("denies write missing required fields", async () => {
      const ctx = env.authenticatedContext(UID);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `print/${ENV}/reading-position/${DOC_ID}`), {
          uid: UID,
          // missing mediaId and position
        }),
      );
    });

    it("denies another user writing", async () => {
      const ctx = env.authenticatedContext("other-user");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `print/${ENV}/reading-position/${DOC_ID}`), {
          uid: "other-user",
          mediaId: MEDIA_ID,
          position: 0,
        }),
      );
    });
  });
});
