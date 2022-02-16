import { dirname, join } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { copy } from "../deps/fs_copy.ts";
import { concurrent, normalizePath, sha1 } from "./utils.ts";

import type { Page } from "./filesystem.ts";
import type Logger from "./logger.ts";

export interface Options {
  src: string;
  dest: string;
  logger: Logger;
}

/**
 * Class to write the generated pages and static files
 * in the dest folder.
 */
export default class Writer {
  src: string;
  dest: string;
  logger: Logger;
  #hashes = new Map();

  constructor(options: Options) {
    this.src = options.src;
    this.dest = options.dest;
    this.logger = options.logger;
  }

  /**
   * Save the pages in the dest folder
   * Returns an array of pages that have been saved
   */
  async savePages(pages: Page[]): Promise<Page[]> {
    const savedPages: Page[] = [];

    await concurrent(
      pages,
      async (page) => {
        if (await this.savePage(page)) {
          savedPages.push(page);
        }
      },
    );

    return savedPages;
  }

  /**
   * Save a page in the dest folder
   * Returns a boolean indicating if the page has saved
   */
  async savePage(page: Page): Promise<boolean> {
    // Ignore empty files
    if (!page.content) {
      return false;
    }

    const dest = page.dest.path + page.dest.ext;
    const hash = await sha1(page.content);
    const previousHash = this.#hashes.get(dest);

    // The page content didn't change
    if (previousHash === hash) {
      return false;
    }

    this.#hashes.set(dest, hash);

    const src = page.src.path
      ? page.src.path + (page.src.ext || "")
      : "(generated)";
    this.logger.log(`🔥 ${dest.replace(/index\.html?$/, "")} <dim>${src}</dim>`);

    const filename = join(this.dest, dest);
    await ensureDir(dirname(filename));

    const file = await Deno.open(filename, { write: true, create: true });
    try {
      await Deno.flock(file.rid);
      await file.truncate();
      const contentStream = page.content instanceof Uint8Array
        ? page.content
        : new TextEncoder().encode(page.content);
      await file.write(contentStream);
    } finally {
      file.close();
    }
    return true;
  }

  /** Copy a static file in the dest folder */
  async copyFile(from: string, to: string) {
    const pathFrom = join(this.src, from);
    const pathTo = join(this.dest, to);

    try {
      await ensureDir(dirname(pathTo));
      this.logger.log(`🔥 ${normalizePath(to)} <dim>${from}</dim>`);
      return copy(pathFrom, pathTo, { overwrite: true });
    } catch {
      //Ignored
    }
  }

  /** Empty the dest folder */
  async clear() {
    await emptyDir(this.dest);
    this.#hashes.clear();
  }
}
