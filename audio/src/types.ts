export const AUDIO_FORMATS = ["mp3", "m4a", "flac", "ogg", "wav"] as const;
export type AudioFormat = (typeof AUDIO_FORMATS)[number];

/**
 * The single authoritative extension→MIME map for the supported DRM-free audio
 * formats, keyed by the closed `AudioFormat` union. Both the cloud storage path
 * and the local-folder source key off this map, so the two can never drift.
 */
export const AUDIO_MIME_TYPES: Record<AudioFormat, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

export interface AudioItem {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly trackNumber: number | null;
  readonly genre: string;
  readonly year: number | null;
  readonly duration: number;
  readonly format: AudioFormat;
  readonly publicDomain: boolean;
  readonly sourceNotes: string;
  readonly storagePath: string;
  readonly groupId: string | null;
  readonly memberEmails: readonly string[];
  readonly addedAt: string;
}

export type AudioOrigin = "cloud" | "local";

export type LibraryItem = AudioItem & {
  readonly origin: AudioOrigin;
  readonly localName?: string;
};

export interface AudioTags {
  title?: string;
  artist?: string;
  album?: string;
  trackNumber?: number;
  genre?: string;
  year?: number;
  duration?: number;
}
