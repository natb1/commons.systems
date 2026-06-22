import { describe, it, expect, vi, beforeEach } from "vitest";

// Control the parseBuffer mock via this ref
const mockParseBuffer = vi.fn();

vi.mock("music-metadata", () => ({
  parseBuffer: (...args: unknown[]) => mockParseBuffer(...args),
}));

const mockLogError = vi.fn();

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import { extractAudioMetadata } from "../src/local-metadata.js";

const buf = new ArrayBuffer(8);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("extractAudioMetadata", () => {
  describe("field mapping", () => {
    it("maps all standard fields from a fully-tagged result", async () => {
      mockParseBuffer.mockResolvedValue({
        common: {
          title: "T",
          artist: "A",
          album: "Alb",
          track: { no: 3, of: 10 },
          genre: ["Rock"],
          year: 1999,
        },
        format: { duration: 212.5 },
      });

      const result = await extractAudioMetadata(buf, "mp3");

      expect(result).toEqual({
        title: "T",
        artist: "A",
        album: "Alb",
        trackNumber: 3,
        genre: "Rock",
        year: 1999,
        duration: 212.5,
      });
    });

    it("preserves duration even with no tags (wav-style case)", async () => {
      mockParseBuffer.mockResolvedValue({
        common: {},
        format: { duration: 5 },
      });

      const result = await extractAudioMetadata(buf, "wav");

      expect(result.duration).toBe(5);
      expect("title" in result).toBe(false);
      expect("artist" in result).toBe(false);
    });
  });

  describe("whitespace / partial fields", () => {
    it("trims whitespace-only title and omits it", async () => {
      mockParseBuffer.mockResolvedValue({
        common: { title: "  " },
        format: {},
      });

      const result = await extractAudioMetadata(buf, "mp3");

      expect("title" in result).toBe(false);
    });

    it("returns empty object when all common fields are missing and no duration", async () => {
      mockParseBuffer.mockResolvedValue({
        common: {},
        format: {},
      });

      const result = await extractAudioMetadata(buf, "flac");

      expect(result).toEqual({});
    });
  });

  describe("wrong-typed leaves dropped", () => {
    it("drops year when it is a string", async () => {
      mockParseBuffer.mockResolvedValue({
        common: { year: "1999" },
        format: {},
      });

      const result = await extractAudioMetadata(buf, "mp3");

      expect("year" in result).toBe(false);
    });

    it("drops duration when it is a string", async () => {
      mockParseBuffer.mockResolvedValue({
        common: {},
        format: { duration: "212.5" },
      });

      const result = await extractAudioMetadata(buf, "mp3");

      expect("duration" in result).toBe(false);
    });

    it("drops trackNumber when track.no is a string", async () => {
      mockParseBuffer.mockResolvedValue({
        common: { track: { no: "3" } },
        format: {},
      });

      const result = await extractAudioMetadata(buf, "mp3");

      expect("trackNumber" in result).toBe(false);
    });
  });

  describe("track.no absent", () => {
    it("omits trackNumber when common.track is undefined", async () => {
      mockParseBuffer.mockResolvedValue({
        common: { title: "Song" },
        format: {},
      });

      const result = await extractAudioMetadata(buf, "mp3");

      expect("trackNumber" in result).toBe(false);
    });

    it("omits trackNumber when track.no is null", async () => {
      mockParseBuffer.mockResolvedValue({
        common: { track: { no: null } },
        format: {},
      });

      const result = await extractAudioMetadata(buf, "mp3");

      expect("trackNumber" in result).toBe(false);
    });
  });

  describe("tolerance / error handling", () => {
    it("returns {} and calls logError when parseBuffer throws", async () => {
      const err = new Error("corrupt file");
      mockParseBuffer.mockRejectedValue(err);

      const result = await extractAudioMetadata(buf, "ogg");

      expect(result).toEqual({});
      expect(mockLogError).toHaveBeenCalledWith(err, {
        operation: "extractAudioMetadata",
        format: "ogg",
      });
    });
  });
});
