import type { Page } from "./file.ts";

export type Extensions = string[] | "*";

/**
 * Class to store and run the (pre)processors
 */
export default class Processors {
  /** Processors and the assigned extensions */
  processors = new Map<Processor, Extensions>();

  /** Assign a processor to some extensions */
  set(extensions: Extensions, processor: Processor): void {
    if (Array.isArray(extensions)) {
      extensions.forEach((extension) => {
        if (extension.charAt(0) !== ".") {
          throw new Error(
            `Invalid extension ${extension}. It must start with '.'`,
          );
        }
      });
    }

    this.processors.set(processor, extensions);
  }

  /** Apply the processors to the provided pages */
  async run(pages: Page[]): Promise<void> {
    for (const [process, extensions] of this.processors) {
      const filtered = pages.filter((page) => pageMatches(extensions, page));
      await (process as Processor)(filtered, pages);
    }
  }
}

/** A (pre)processor */
export type Processor = (
  pages: Page[],
  allpages: Page[],
) => void | false | Promise<void | false>;

function pageMatches(exts: Extensions, page: Page): boolean {
  if (exts === "*") {
    return true;
  }

  if (page.src.ext && exts.includes(page.src.ext)) {
    return true;
  }

  const url = page.outputPath;

  if (typeof url === "string" && exts.some((ext) => url.endsWith(ext))) {
    return true;
  }

  return false;
}
