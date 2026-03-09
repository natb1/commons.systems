export const MEDIA_TYPES = ["epub", "pdf", "image-archive"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface MediaItem {
  readonly id: string;
  readonly title: string;
  readonly mediaType: MediaType;
  readonly tags: Readonly<Record<string, string>>;
  readonly publicDomain: boolean;
  readonly sourceNotes: string;
  readonly storagePath: string;
  readonly groupId: string | null;
  readonly memberUids: readonly string[];
  readonly addedAt: string;
}
