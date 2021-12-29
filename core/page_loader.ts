import { basename, extname } from "../deps/path.ts";
import { Exception } from "./errors.ts";
import AssetLoader from "./asset_loader.ts";

import type { Data, Dest, Page, Src } from "../core.ts";

/**
 * Class to load page files that generate HTML documents.
 * It's very similar to the AssetLoader, but it removes the extension
 * and ensure there's a `date` property in the data.
 */
export default class PageLoader extends AssetLoader {
  /** Prepare the data and the page */
  prepare(page: Page, data: Data): void {
    super.prepare(page, data);

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
