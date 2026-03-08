export interface StorageSeedItem {
  path: string;
  content: string;
  metadata: Record<string, string>;
}

const storageSeed: StorageSeedItem[] = [
  {
    path: "print/prod/media/pg3296-images-3.epub",
    content: "dummy epub content for testing",
    metadata: { publicDomain: "true" },
  },
  {
    path: "print/prod/media/phaedrus-david-horan-translation-7-nov-25.pdf",
    content: "dummy pdf content for testing",
    metadata: { publicDomain: "true" },
  },
  {
    path: "print/prod/media/republic-i-to-x-david-horan-translation-22-nov-25.pdf",
    content: "dummy pdf content for testing",
    metadata: { publicDomain: "true" },
  },
  {
    path: "print/prod/media/private-collection-1.pdf",
    content: "dummy private pdf content for testing",
    metadata: { publicDomain: "false", "test-github-user": "member" },
  },
];

export default storageSeed;
