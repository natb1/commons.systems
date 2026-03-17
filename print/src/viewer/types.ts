export interface ContentRenderer {
  init(container: HTMLElement, url: string, initialPosition?: string): Promise<void>;
  goToPage(page: number): Promise<void>;
  next(): Promise<void>;
  prev(): Promise<void>;
  readonly pageCount: number;
  readonly currentPage: number;
  readonly position: string;
  readonly positionLabel: string;
  destroy(): void;
}
