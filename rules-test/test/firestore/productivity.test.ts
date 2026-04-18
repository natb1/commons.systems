import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
  describeGroupsCollection,
} from "../setup.js";

const ENV = "test";
const MEMBERS = ["member@test.com", "other@test.com"];
const GROUP = "group1";

const CREATED_AT = Timestamp.fromDate(new Date("2026-04-17T00:00:00Z"));

describeGroupsCollection("productivity");

const baseAgendaItem = {
  title: "Daily review",
  notes: "",
  scheduledAt: Timestamp.fromDate(new Date("2026-04-18T09:00:00Z")),
  status: "todo",
  createdAt: CREATED_AT,
  groupId: GROUP,
  memberEmails: MEMBERS,
};

describe("productivity agenda-items", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `productivity/${ENV}/groups/${GROUP}`, { members: MEMBERS });
    await adminSetDoc(env, `productivity/${ENV}/agenda-items/item1`, baseAgendaItem);
  });

  describe("read", () => {
    it("allows member to read", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertSucceeds(getDoc(doc(db, `productivity/${ENV}/agenda-items/item1`)));
    });

    it("denies non-member read", async () => {
      const db = authenticatedContext(env, "stranger@test.com").firestore();
      await assertFails(getDoc(doc(db, `productivity/${ENV}/agenda-items/item1`)));
    });

    it("denies unauthenticated read", async () => {
      const db = unauthenticatedContext(env).firestore();
      await assertFails(getDoc(doc(db, `productivity/${ENV}/agenda-items/item1`)));
    });
  });

  describe("create", () => {
    it("allows member to create with valid data", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertSucceeds(
        setDoc(doc(db, `productivity/${ENV}/agenda-items/item2`), baseAgendaItem),
      );
    });

    it("accepts null scheduledAt", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertSucceeds(
        setDoc(doc(db, `productivity/${ENV}/agenda-items/item3`), {
          ...baseAgendaItem,
          scheduledAt: null,
        }),
      );
    });

    it("denies empty title", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertFails(
        setDoc(doc(db, `productivity/${ENV}/agenda-items/item4`), {
          ...baseAgendaItem,
          title: "",
        }),
      );
    });

    it("denies invalid status", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertFails(
        setDoc(doc(db, `productivity/${ENV}/agenda-items/item5`), {
          ...baseAgendaItem,
          status: "archived",
        }),
      );
    });

    it("denies mismatched memberEmails", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertFails(
        setDoc(doc(db, `productivity/${ENV}/agenda-items/item6`), {
          ...baseAgendaItem,
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies non-member create", async () => {
      const db = authenticatedContext(env, "stranger@test.com").firestore();
      await assertFails(
        setDoc(doc(db, `productivity/${ENV}/agenda-items/item7`), baseAgendaItem),
      );
    });

    it("denies extra fields", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertFails(
        setDoc(doc(db, `productivity/${ENV}/agenda-items/item8`), {
          ...baseAgendaItem,
          extraField: "nope",
        }),
      );
    });
  });

  describe("update", () => {
    it("allows updating mutable fields", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertSucceeds(
        updateDoc(doc(db, `productivity/${ENV}/agenda-items/item1`), {
          title: "Updated",
          notes: "Added a note",
          status: "done",
        }),
      );
    });

    it("denies changing groupId", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertFails(
        updateDoc(doc(db, `productivity/${ENV}/agenda-items/item1`), {
          groupId: "group2",
        }),
      );
    });

    it("denies changing memberEmails", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertFails(
        updateDoc(doc(db, `productivity/${ENV}/agenda-items/item1`), {
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies changing createdAt", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertFails(
        updateDoc(doc(db, `productivity/${ENV}/agenda-items/item1`), {
          createdAt: Timestamp.fromDate(new Date("2025-01-01T00:00:00Z")),
        }),
      );
    });

    it("denies non-member update", async () => {
      const db = authenticatedContext(env, "stranger@test.com").firestore();
      await assertFails(
        updateDoc(doc(db, `productivity/${ENV}/agenda-items/item1`), {
          title: "HACK",
        }),
      );
    });
  });

  describe("delete", () => {
    it("allows member to delete", async () => {
      const db = authenticatedContext(env, "member@test.com").firestore();
      await assertSucceeds(
        deleteDoc(doc(db, `productivity/${ENV}/agenda-items/item1`)),
      );
    });

    it("denies non-member delete", async () => {
      const db = authenticatedContext(env, "stranger@test.com").firestore();
      await assertFails(
        deleteDoc(doc(db, `productivity/${ENV}/agenda-items/item1`)),
      );
    });
  });
});

const baseFeedEntry = {
  source: "rss",
  sourceKey: "overreacted",
  title: "A post",
  url: "https://overreacted.io/a-post",
  snippet: "...",
  publishedAt: Timestamp.fromDate(new Date("2026-04-15T12:00:00Z")),
  read: false,
  saved: false,
  createdAt: CREATED_AT,
  groupId: GROUP,
  memberEmails: MEMBERS,
};

describe("productivity feed-entries", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `productivity/${ENV}/groups/${GROUP}`, { members: MEMBERS });
    await adminSetDoc(env, `productivity/${ENV}/feed-entries/entry1`, baseFeedEntry);
  });

  it("allows member read", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(getDoc(doc(db, `productivity/${ENV}/feed-entries/entry1`)));
  });

  it("denies non-member read", async () => {
    const db = authenticatedContext(env, "stranger@test.com").firestore();
    await assertFails(getDoc(doc(db, `productivity/${ENV}/feed-entries/entry1`)));
  });

  it("allows member create with valid data", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(
      setDoc(doc(db, `productivity/${ENV}/feed-entries/entry2`), baseFeedEntry),
    );
  });

  it("denies unknown source", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/feed-entries/entry3`), {
        ...baseFeedEntry,
        source: "mastodon",
      }),
    );
  });

  it("denies non-boolean read flag", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/feed-entries/entry4`), {
        ...baseFeedEntry,
        read: "false",
      }),
    );
  });

  it("allows updating read flag", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(
      updateDoc(doc(db, `productivity/${ENV}/feed-entries/entry1`), { read: true }),
    );
  });

  it("denies changing groupId on update", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      updateDoc(doc(db, `productivity/${ENV}/feed-entries/entry1`), { groupId: "group2" }),
    );
  });

  it("allows member delete", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(
      deleteDoc(doc(db, `productivity/${ENV}/feed-entries/entry1`)),
    );
  });

  it("denies non-member delete", async () => {
    const db = authenticatedContext(env, "stranger@test.com").firestore();
    await assertFails(
      deleteDoc(doc(db, `productivity/${ENV}/feed-entries/entry1`)),
    );
  });
});

const baseMessage = {
  source: "discord",
  sourceKey: "#general",
  sender: "alice",
  body: "hi there",
  sentAt: Timestamp.fromDate(new Date("2026-04-10T08:00:00Z")),
  read: false,
  actioned: false,
  createdAt: CREATED_AT,
  groupId: GROUP,
  memberEmails: MEMBERS,
};

describe("productivity messages", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `productivity/${ENV}/groups/${GROUP}`, { members: MEMBERS });
    await adminSetDoc(env, `productivity/${ENV}/messages/msg1`, baseMessage);
  });

  it("allows member read", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(getDoc(doc(db, `productivity/${ENV}/messages/msg1`)));
  });

  it("denies non-member read", async () => {
    const db = authenticatedContext(env, "stranger@test.com").firestore();
    await assertFails(getDoc(doc(db, `productivity/${ENV}/messages/msg1`)));
  });

  it("allows member create with valid data", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(
      setDoc(doc(db, `productivity/${ENV}/messages/msg2`), baseMessage),
    );
  });

  it("denies unknown source", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/messages/msg3`), {
        ...baseMessage,
        source: "sms",
      }),
    );
  });

  it("allows updating actioned flag", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(
      updateDoc(doc(db, `productivity/${ENV}/messages/msg1`), { actioned: true }),
    );
  });

  it("denies changing memberEmails on update", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      updateDoc(doc(db, `productivity/${ENV}/messages/msg1`), {
        memberEmails: ["member@test.com"],
      }),
    );
  });

  it("allows member delete", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(deleteDoc(doc(db, `productivity/${ENV}/messages/msg1`)));
  });
});

const baseGoal = {
  title: "Ship MVP",
  horizon: "quarterly",
  priority: 1,
  status: "active",
  progress: 25,
  createdAt: CREATED_AT,
  groupId: GROUP,
  memberEmails: MEMBERS,
};

describe("productivity goals", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `productivity/${ENV}/groups/${GROUP}`, { members: MEMBERS });
    await adminSetDoc(env, `productivity/${ENV}/goals/goal1`, baseGoal);
  });

  it("allows member read", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(getDoc(doc(db, `productivity/${ENV}/goals/goal1`)));
  });

  it("denies non-member read", async () => {
    const db = authenticatedContext(env, "stranger@test.com").firestore();
    await assertFails(getDoc(doc(db, `productivity/${ENV}/goals/goal1`)));
  });

  it("allows member create with valid data", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(
      setDoc(doc(db, `productivity/${ENV}/goals/goal2`), baseGoal),
    );
  });

  it("denies progress below 0", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/goals/goal3`), {
        ...baseGoal,
        progress: -1,
      }),
    );
  });

  it("denies progress above 100", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/goals/goal4`), {
        ...baseGoal,
        progress: 101,
      }),
    );
  });

  it("denies negative priority", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/goals/goal5`), {
        ...baseGoal,
        priority: -1,
      }),
    );
  });

  it("denies unknown horizon", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/goals/goal6`), {
        ...baseGoal,
        horizon: "monthly",
      }),
    );
  });

  it("denies unknown status", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      setDoc(doc(db, `productivity/${ENV}/goals/goal7`), {
        ...baseGoal,
        status: "paused",
      }),
    );
  });

  it("allows updating progress and status", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(
      updateDoc(doc(db, `productivity/${ENV}/goals/goal1`), {
        progress: 75,
        status: "done",
      }),
    );
  });

  it("denies changing createdAt on update", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertFails(
      updateDoc(doc(db, `productivity/${ENV}/goals/goal1`), {
        createdAt: Timestamp.fromDate(new Date("2025-01-01T00:00:00Z")),
      }),
    );
  });

  it("allows member delete", async () => {
    const db = authenticatedContext(env, "member@test.com").firestore();
    await assertSucceeds(deleteDoc(doc(db, `productivity/${ENV}/goals/goal1`)));
  });
});
