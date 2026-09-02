import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import {
  GAP_NOTE_KEYS,
  deriveGapNoteFrontier,
  gapNoteFileName,
  gapNotePath,
  gapNotesDir,
  validateGapNoteRecord,
  type GapNoteRecord,
} from "../src/gap-notes.js";

function record(partial: Partial<GapNoteRecord> = {}): GapNoteRecord {
  return {
    subject: partial.subject ?? "some-subject",
    detail: partial.detail ?? "some detail",
    recorded_at: partial.recorded_at ?? "2026-09-01",
    disposed_by: partial.disposed_by ?? null,
  };
}

describe("validateGapNoteRecord", () => {
  it("accepts a valid record and normalizes field order", () => {
    const validated = validateGapNoteRecord({
      disposed_by: null,
      recorded_at: "2026-09-01",
      detail: "d",
      subject: "s",
    });
    expect(Object.keys(validated)).toEqual(["subject", "detail", "recorded_at", "disposed_by"]);
  });

  it("rejects an unknown key — the shape is closed", () => {
    expect(() =>
      validateGapNoteRecord({ ...record(), schema: "gap-note.v1" }),
    ).toThrow(IntentionSchemaError);
    expect(() => validateGapNoteRecord({ ...record(), schema: "gap-note.v1" })).toThrow(/schema/);
  });

  it("rejects a missing subject", () => {
    const { subject, ...rest } = record();
    void subject;
    expect(() => validateGapNoteRecord(rest)).toThrow(IntentionSchemaError);
  });

  it("rejects a non-date recorded_at", () => {
    expect(() => validateGapNoteRecord(record({ recorded_at: "not-a-date" }))).toThrow(
      IntentionSchemaError,
    );
  });

  it("accepts disposed_by: null and a non-empty disposed_by string alike", () => {
    expect(validateGapNoteRecord(record({ disposed_by: null })).disposed_by).toBeNull();
    expect(validateGapNoteRecord(record({ disposed_by: "some-actor" })).disposed_by).toBe(
      "some-actor",
    );
  });

  it("rejects an empty-string disposed_by", () => {
    expect(() => validateGapNoteRecord(record({ disposed_by: "" }))).toThrow(IntentionSchemaError);
  });
});

describe("GAP_NOTE_KEYS", () => {
  it("is exactly the plan's four-field shape", () => {
    expect([...GAP_NOTE_KEYS].sort()).toEqual(
      ["detail", "disposed_by", "recorded_at", "subject"].sort(),
    );
  });
});

describe("path helpers", () => {
  it("gapNotesDir is <dir>/operational/gap-notes", () => {
    expect(gapNotesDir("/repo/intentions")).toBe("/repo/intentions/operational/gap-notes");
  });

  it("gapNoteFileName is deterministic and content-addressed", () => {
    const a = gapNoteFileName(record());
    const b = gapNoteFileName(record());
    expect(a).toBe(b);
    expect(a).toMatch(/^20260901-[0-9a-f]{12}\.json$/);
  });

  it("a different record produces a different file name", () => {
    expect(gapNoteFileName(record({ subject: "a" }))).not.toBe(gapNoteFileName(record({ subject: "b" })));
  });

  it("gapNotePath joins the dir, subdir and file name", () => {
    const r = record();
    expect(gapNotePath("/repo/intentions", r)).toBe(
      `/repo/intentions/operational/gap-notes/${gapNoteFileName(r)}`,
    );
  });
});

describe("deriveGapNoteFrontier", () => {
  it("emits one prose-gap entry per record whose disposed_by is null", () => {
    const entries = deriveGapNoteFrontier([record({ subject: "s1" }), record({ subject: "s2" })]);
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.kind === "prose-gap")).toBe(true);
    expect(entries.every((e) => e.criterion === null && e.authority === null)).toBe(true);
    expect(entries.map((e) => e.subject).sort()).toEqual(["s1", "s2"]);
  });

  it("a record with a non-null disposed_by yields NO entry — it is resolved", () => {
    const entries = deriveGapNoteFrontier([record({ disposed_by: "some-fold" })]);
    expect(entries).toEqual([]);
  });

  it("mixes disposed and open records correctly", () => {
    const entries = deriveGapNoteFrontier([
      record({ subject: "open", disposed_by: null }),
      record({ subject: "closed", disposed_by: "folded" }),
    ]);
    expect(entries.map((e) => e.subject)).toEqual(["open"]);
  });

  it("carries the record's subject and detail through verbatim", () => {
    const entries = deriveGapNoteFrontier([record({ subject: "the-subject", detail: "the detail text" })]);
    expect(entries[0].subject).toBe("the-subject");
    expect(entries[0].detail).toBe("the detail text");
  });

  it("an empty record list yields an empty frontier", () => {
    expect(deriveGapNoteFrontier([])).toEqual([]);
  });

  it("gives two open notes on the SAME subject distinct ids", () => {
    // The store is content-addressed over the whole record, so two open notes
    // on one subject coexist legitimately. Keying the entry id on `subject`
    // alone would emit two entries under one id, breaking the uniqueness
    // ReconciliationFrontierEntry promises and making either one uncitable.
    const entries = deriveGapNoteFrontier([
      record({ subject: "tactic-x", detail: "deliverable A is absent" }),
      record({ subject: "tactic-x", detail: "deliverable B is absent" }),
    ]);
    expect(entries).toHaveLength(2);
    expect(new Set(entries.map((e) => e.id)).size).toBe(2);
    expect(entries.every((e) => e.id.startsWith("prose-gap:tactic-x:"))).toBe(true);
  });

  it("keys the entry id on the same content hash the record's own filename carries", () => {
    const r = record({ subject: "tactic-x" });
    const [entry] = deriveGapNoteFrontier([r]);
    // `<YYYYMMDD>-<hash12>.json` — the id's discriminator is that same hash12,
    // so an entry is traceable to the file it came from.
    const hash12 = gapNoteFileName(r).replace(/^\d{8}-/, "").replace(/\.json$/, "");
    expect(entry.id).toBe(`prose-gap:tactic-x:${hash12}`);
  });
});
