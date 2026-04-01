export const AUDIO_FORMATS = ["mp3", "m4a", "flac", "ogg", "wav"] as const;
export type AudioFormat = (typeof AUDIO_FORMATS)[number];

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
