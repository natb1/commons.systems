export interface ContentRenderer {
  init(container: HTMLElement, url: string, initialPosition?: string): Promise<void>;
  goToPage(page: number): Promise<void>;
  readonly position: string;
  readonly pageCount: number;
  readonly currentPage: number;
  destroy(): void;
}
