import { Page } from "./filesystem.ts";
import { posix } from "../deps/path.ts";

import type { Format, Reader } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;
}

/**
 * Class to load page files that generate assets (css, js, etc).
 */
export default class PageLoader {
  /** The filesystem reader */
  reader: Reader;

  constructor(options: Options) {
    this.reader = options.reader;
  }

  /** Load an asset Page */
  async load(
    path: string,
    formatEntry: [string, Format],
  ): Promise<Page | undefined> {
    const [ext, format] = formatEntry;

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

    if (format.page === "html") {
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
