export type MediaType = "epub" | "pdf" | "image-archive";

export interface MediaItem {
  readonly id: string;
  readonly title: string;
  readonly mediaType: MediaType;
  readonly tags: Record<string, string>;
  readonly publicDomain: boolean;
  readonly sourceNotes: string;
  readonly storagePath: string;
  readonly groupId: string | null;
  readonly memberUids: readonly string[];
  readonly addedAt: string;
}
