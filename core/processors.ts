import { matchExtension } from "./utils/path.ts";

import type { Extensions } from "./utils/path.ts";
import type { Page, StaticFile } from "./file.ts";

/**
 * Class to store and run the (pre)processors
 */
export default class Processors {
  /** Processors and the assigned extensions */
  processors = new Map<Processor, Extensions>();

  /** Loaded extensions cache */
  loadedExtensions = new Set<string>();

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
  async run(pages: Page[], files?: StaticFile[]): Promise<void> {
    this.loadedExtensions.clear();

    for (const [process, extensions] of this.processors) {
      // Process all loaded pages
      if (extensions === "*") {
        await (process as Processor)([...pages], pages);
        continue;
      }

      // Load files with the same extension
      if (files) {
        await this.#loadFiles(extensions, files, pages);
      }

      const filtered = pages.filter((page) => pageMatches(extensions, page));
      await (process as Processor)(filtered, pages);
    }
  }

  /** Load the files with the same extension */
  async #loadFiles(
    extensions: string[],
    files: StaticFile[],
    pages: Page[],
  ): Promise<void> {
    for (const extension of extensions) {
      if (this.loadedExtensions.has(extension)) {
        continue;
      }

      this.loadedExtensions.add(extension);

      for (const file of files) {
        if (file.src.ext === extension) {
          const page = await file.toPage();
          const index = files.indexOf(file);
          files.splice(index, 1);
          pages.push(page);
        }
      }
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

function pageMatches(exts: Extensions, page: Page): boolean {
  if (exts === "*") {
    return true;
  }

  if (page.src.ext && exts.includes(page.src.ext)) {
    return true;
  }

  const url = page.outputPath;

  return matchExtension(exts, url);
}
