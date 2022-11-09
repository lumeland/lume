import { concurrent } from "./utils.ts";
import { Exception } from "./errors.ts";

import type { Page } from "../core.ts";

/**
 * Class to store and run the (pre)processors
 */
export default class Processors {
  /** Processors and the assigned extensions */
  processors = new Map<Processor, string[] | "*">();

  /** Assign a processor to some extensions */
  set(extensions: string[] | "*", processor: Processor) {
    if (Array.isArray(extensions)) {
      extensions.forEach((extension) => {
        if (extension.charAt(0) !== ".") {
          throw new Exception(
            "Invalid extension. It must start with '.'",
            { extension },
          );
        }
      });
    }

    this.processors.set(processor, extensions);
  }

  /** Apply the processors to the provided pages */
  async run(pages: Page[]): Promise<void> {
    const removed: Page[] = [];

    for (const [process, exts] of this.processors) {
      await concurrent(
        pages,
        async (page) => {
          try {
            if (exts === "*" || pageMatches(exts, page)) {
              if (await process(page, pages) === false) {
                removed.push(page);
              }
            }
          } catch (cause) {
            throw new Exception("Error processing page", {
              cause,
              page,
              processor: process.name,
            });
          }
        },
      );
    }

    // Remove the pages that have been removed by the processors
    for (const page of removed) {
      pages.splice(pages.indexOf(page), 1);
    }
  }
}

/** A (pre)processor */
export type Processor = (
  page: Page,
  pages: Page[],
) => void | false | Promise<void | false>;

function pageMatches(exts: string[], page: Page): boolean {
  if (page.src.ext && exts.includes(page.src.ext)) {
    return true;
  }

  if (page.isHtml && exts.includes(".html")) {
    return true;
  }

  const url = page.data.url;

  if (typeof url === "string" && exts.some((ext) => url.endsWith(ext))) {
    return true;
  }

  return false;
}
