import { describe, expect, it } from "vitest";
import type { EpubMeta } from "../src/epub-read.js";
import { matchWork, tokenize } from "../src/matching.js";

describe("tokenize", () => {
  it("lowercases, strips diacritics and punctuation, collapses whitespace", () => {
    expect(tokenize("Émile, or On  Education!")).toEqual([ // type-safety-ok: the "!" is inside a string-literal test input, not a non-null assertion
      "emile",
      "or",
      "on",
      "education",
    ]);
  });
});

describe("matchWork", () => {
  const republic: EpubMeta = { title: "The Republic", creators: ["Plato"] };
  const groundwork: EpubMeta = {
    title: "Groundwork of the Metaphysics of Morals: A New Translation",
    creators: ["Immanuel Kant"],
  };
  const critique: EpubMeta = {
    title: "Critique of Pure Reason",
    creators: ["Immanuel Kant"],
  };

  it("matches on author + significant title tokens, ignoring stopwords", () => {
    expect(matchWork("Plato, Republic", [republic, groundwork])).toEqual({
      kind: "match",
      index: 0,
    });
  });

  it("matches despite subtitle noise in the candidate title", () => {
    expect(
      matchWork("Kant, Groundwork of the Metaphysics of Morals", [
        republic,
        groundwork,
      ]),
    ).toEqual({ kind: "match", index: 1 });
  });

  it("matches through diacritics in the creator", () => {
    const kierkegaard: EpubMeta = {
      title: "Fear and Trembling",
      creators: ["Søren Kierkegaard"],
    };
    expect(matchWork("Kierkegaard, Fear and Trembling", [kierkegaard])).toEqual({
      kind: "match",
      index: 0,
    });
  });

  it("returns missing when no candidate satisfies the tokens", () => {
    expect(matchWork("Aristotle, Nicomachean Ethics", [republic])).toEqual({
      kind: "missing",
    });
  });

  it("returns ambiguous when two candidates match", () => {
    const result = matchWork("Kant, Critique", [critique, { ...critique }]);
    expect(result).toEqual({ kind: "ambiguous", indices: [0, 1] });
  });
});
