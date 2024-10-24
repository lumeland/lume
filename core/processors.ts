import { matchExtension } from "./utils/path.ts";

import type { Extensions } from "./utils/path.ts";
import type { Page } from "./file.ts";

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

/**
 * Processor callback is used in both (pre)process methods.
 */
export type Processor = (
  filteredPages: Page[],
  allPages: Page[],
) => void | false | Promise<void | false>;

export function pageMatches(exts: Extensions, page: Page): boolean {
  if (exts === "*") {
    return true;
  }

  if (page.src.ext && exts.includes(page.src.ext)) {
    return true;
  }

  const url = page.outputPath;

  return matchExtension(exts, url);
}
