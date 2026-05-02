declare module "critters" {
  interface CrittersOptions {
    path?: string;
    preload?: "media" | "swap" | "js" | "js-lazy" | "body";
    inlineFonts?: boolean;
  }

  export default class Critters {
    constructor(options?: CrittersOptions);
    process(html: string): Promise<string>;
  }
}
