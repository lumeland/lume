import { Page } from "./filesystem.ts";
import { posix } from "../deps/path.ts";

import type { Formats, Reader } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;

  /** The extensions instance used to save the loaders */
  formats: Formats;
}

/**
 * Class to load page files that generate assets (css, js, etc).
 */
export default class PageLoader {
  /** The filesystem reader */
  reader: Reader;

  /** List of extensions to load page files and the loader used */
  formats: Formats;

  constructor(options: Options) {
    this.reader = options.reader;
    this.formats = options.formats;
  }

  /** Load an asset Page */
  async load(path: string): Promise<Page | undefined> {
    // Search for the loader
    const result = this.formats.search(path);

    if (!result) {
      return;
    }

    const [ext, format] = result;

    if (!format.loader || !format.page) {
      return;
    }

    const info = await this.reader.getInfo(path);

    if (!info) {
      return;
    }

    // Create the page
    const page = new Page({
      path: path.slice(0, -ext.length),
      lastModified: info?.mtime || undefined,
      created: info?.birthtime || undefined,
      ext,
    });

    // Load the data
    const data = await this.reader.read(path, format.loader);
    Object.assign(page.baseData, data);

    if (format.removeExtension) {
      this.#removeExtension(page);
    }

    return page;
  }

  /** Removes the extension. */
  #removeExtension(page: Page): void {
    // Handle subextensions, like styles.css.njk
    const subext = posix.extname(page.dest.path);

    if (subext) {
      page.dest.path = page.dest.path.slice(0, -subext.length);
      page.dest.ext = subext;
    } else {
      page.dest.ext = "";
    }
  }
}
