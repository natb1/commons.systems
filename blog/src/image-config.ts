export interface ImageConfig {
  baseName: string;
  original: string;
  fullWidth: number;
  fullHeight: number;
  responsiveWidths: number[];
}

export const BLOG_IMAGES: ImageConfig[] = [
  { baseName: "blog-map-color", original: "blog-map-color.jpg", fullWidth: 1600, fullHeight: 1267, responsiveWidths: [400, 800] },
  { baseName: "woman-with-a-flower-head", original: "woman-with-a-flower-head.webp", fullWidth: 1600, fullHeight: 900, responsiveWidths: [400, 800] },
  { baseName: "alienurn", original: "alienurn.jpg", fullWidth: 1920, fullHeight: 1080, responsiveWidths: [400, 800] },
  { baseName: "tile10-armadillo-crag", original: "tile10-armadillo-crag.png", fullWidth: 782, fullHeight: 812, responsiveWidths: [400] },
];
