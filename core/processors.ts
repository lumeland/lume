import { concurrent } from "./utils.ts";

import type { Page } from "./filesystem.ts";

export type Extensions = string[] | "*";

interface ProcessorOptions {
  extensions: Extensions;
  multiple: boolean;
}

/**
 * Class to store and run the (pre)processors
 */
export default class Processors {
  /** Processors and the assigned extensions */
  processors = new Map<Processor | MultiProcessor, ProcessorOptions>();

  /** Assign a processor to some extensions */
  set(extensions: Extensions, processor: Processor, multiple: false): void;
  set(extensions: Extensions, processor: MultiProcessor, multiple: true): void;
  set(
    extensions: Extensions,
    processor: Processor | MultiProcessor,
    multiple = false,
  ): void {
    if (Array.isArray(extensions)) {
      extensions.forEach((extension) => {
        if (extension.charAt(0) !== ".") {
          throw new Error(
            `Invalid extension ${extension}. It must start with '.'`,
          );
        }
      });
    }

    this.processors.set(processor, { extensions, multiple });
  }

  /** Apply the processors to the provided pages */
  async run(pages: Page[]): Promise<void> {
    const removed: Page[] = [];

    for (const [process, { extensions, multiple }] of this.processors) {
      if (multiple) {
        const filtered = pages.filter((page) => pageMatches(extensions, page));
        if (await (process as MultiProcessor)(filtered, pages) === false) {
          removed.push(...filtered);
        }
      } else {
        await concurrent(
          pages,
          async (page) => {
            try {
              if (pageMatches(extensions, page)) {
                if (await (process as Processor)(page, pages) === false) {
                  removed.push(page);
                }
              }
            } catch (cause) {
              throw new Error(
                `Error processing page ${page.sourcePath} with processor ${process.name}`,
                { cause },
              );
            }
          },
        );
      }
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
  allpages: Page[],
) => void | false | Promise<void | false>;

export type MultiProcessor = (
  page: Page[],
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
