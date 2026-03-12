export interface ContentRenderer {
  init(container: HTMLElement, url: string): Promise<void>;
  goToPage(page: number): Promise<void>;
  readonly pageCount: number;
  readonly currentPage: number;
  destroy(): void;
}
