import { Page } from "./filesystem.ts";
import { Exception } from "./errors.ts";
import { basename, extname, join } from "../deps/path.ts";

import type { Data, Dest, Formats, PageType, Reader, Src } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;

  /** The extensions instance used to save the loaders */
  formats: Formats;
}

/**
 * Class to load page files that generate assets (css, js, etc).
 */
export default class ResourceLoader {
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
    path = join("/", path);

    // Search for the loader
    const result = this.formats.search(path);

    if (!result) {
      return;
    }

    const [ext, { pageLoader, pageType }] = result;

    if (!pageLoader || !pageType) {
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

    // Prepare the data
    const data = await this.reader.read(path, pageLoader);
    this.prepare(page, data, pageType);
    page.data = data;

    return page;
  }

  /** Prepare the data and the page */
  prepare(page: Page, data: Data, type: PageType): void {
    if (data.tags) {
      data.tags = Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag))
        : [String(data.tags)];
    }

    if (type === "page") {
      this.preparePage(page, data);
    }
  }

  /**
   * Additional preparation for the HTML pages
   * it removes the extension and ensure there's a `date` property in the data.
   */
  preparePage(page: Page, data: Data): void {
    const datePath = this.#handleDatePath(page.src, page.dest);

    // Ensure the data prop is defined
    if (!data.date) {
      data.date = datePath ?? page.src.created ?? page.src.lastModified;
    } else if (!(data.date instanceof Date)) {
      throw new Exception(
        'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
        { page },
      );
    }

    // Handle subextensions, like styles.css.njk
    const subext = extname(page.dest.path);

    if (subext) {
      page.dest.path = page.dest.path.slice(0, -subext.length);
      page.dest.ext = subext;
    } else {
      page.dest.ext = "";
    }
  }

  /**
   * Detect the date of the page in the filename
   * and remove it in dest.path
   * Example: 2019-01-01_hello-world.md
   */
  #handleDatePath(src: Src, dest: Dest): Date | undefined {
    const fileName = basename(src.path);

    const dateInPath = fileName.match(
      /^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)(?:-(\d\d))?)?_/,
    );

    if (dateInPath) {
      const [found, year, month, day, hour, minute, second] = dateInPath;
      dest.path = dest.path.replace(found, "");

      return new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hour ? parseInt(hour) : 0,
        minute ? parseInt(minute) : 0,
        second ? parseInt(second) : 0,
      ));
    }

    const orderInPath = fileName.match(/^(\d+)_/);

    if (orderInPath) {
      const [found, timestamp] = orderInPath;
      dest.path = dest.path.replace(found, "");
      return new Date(parseInt(timestamp));
    }
  }
}
