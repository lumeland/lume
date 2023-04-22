import { Page } from "./filesystem.ts";

import type { Format, Reader } from "../core.ts";
import type { Entry } from "./fs.ts";

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
    entry: Entry,
    format: Format,
  ): Promise<Page | undefined> {
    if (!format.pageLoader) {
      return;
    }

    const info = entry.getInfo();

    if (!info) {
      return;
    }

    const { ext, asset } = format;

    // Create the page
    const page = new Page({
      path: entry.path.slice(0, -ext.length),
      lastModified: info?.mtime || undefined,
      created: info?.birthtime || undefined,
      remote: entry.url,
      ext,
      asset,
    });

    // Load the data
    const data = await entry.getContent(format.pageLoader);
    Object.assign(page.baseData, data);
    return page;
  }
}
