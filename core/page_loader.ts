import { Page } from "./filesystem.ts";
import { Exception } from "./errors.ts";
import { posix } from "../deps/path.ts";

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

    // Ensure the data prop is defined and it's a Date instance
    if (!data.date) {
      data.date = datePath ?? page.src.created ?? page.src.lastModified;
    } else {
      if (typeof data.date === "string" || typeof data.date === "number") {
        data.date = this.#createDate(data.date);
      }

      if (!(data.date instanceof Date)) {
        throw new Exception(
          'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
          { page },
        );
      }
    }

    // Handle subextensions, like styles.css.njk
    const subext = posix.extname(page.dest.path);

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
    const fileName = posix.basename(src.path);
    const dateInPath = fileName.match(/^([^_]+)?_/);

    if (dateInPath) {
      const [found, dateStr] = dateInPath;
      const date = this.#createDate(dateStr);

      if (date) {
        dest.path = dest.path.replace(found, "");
        return date;
      }
    }
  }

  /**
   * Create a Date instance from a string or number
   */
  #createDate(str: string | number): Date | undefined {
    if (typeof str === "number") {
      return new Date(str);
    }

    const datetime = str.match(
      /^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)(?:-(\d\d))?)?$/,
    );

    if (datetime) {
      const [, year, month, day, hour, minute, second] = datetime;

      return new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hour ? parseInt(hour) : 0,
        minute ? parseInt(minute) : 0,
        second ? parseInt(second) : 0,
      ));
    }

    if (str.match(/^\d+$/)) {
      return new Date(parseInt(str));
    }
  }
}
