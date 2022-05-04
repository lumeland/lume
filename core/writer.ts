import { dirname, join } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { concurrent, normalizePath, sha1 } from "./utils.ts";
import { Exception } from "./errors.ts";

import type { Page, StaticFile } from "./filesystem.ts";
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
  #saveCount = 0;
  #outputs = new Map<string, [number, string, string]>();

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
    ++this.#saveCount;

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
    const src = page.src.path
      ? page.src.path + (page.src.ext || "")
      : "(generated)";
    const dest = page.dest.path + page.dest.ext;
    const id = dest.toLowerCase();
    const hash = await sha1(page.content);
    const previous = this.#outputs.get(id);
    this.#outputs.set(id, [this.#saveCount, src, hash]);

    if (previous) {
      const [previousCount, previousPage, previousHash] = previous;

      if (previousCount === this.#saveCount) {
        throw new Exception(
          "A page will overwrite another page. Use distinct `url` values to resolve the conflict.",
          {
            page,
            previousPage,
            destination: dest,
          },
        );
      }

      // The page content didn't change
      if (previousHash === hash) {
        return false;
      }
    }

    this.logger.log(`🔥 ${dest.replace(/index\.html?$/, "")} <dim>${src}</dim>`);

    const filename = join(this.dest, dest);
    await ensureDir(dirname(filename));

    page.content instanceof Uint8Array
      ? await Deno.writeFile(filename, page.content)
      : await Deno.writeTextFile(filename, page.content);

    return true;
  }

  /** Copy a static file in the dest folder */
  async copyFile(file: StaticFile) {
    const { src, dest } = file;
    const pathFrom = join(this.src, src);
    const pathTo = join(this.dest, dest);

    try {
      await ensureDir(dirname(pathTo));
      this.logger.log(`➡️ ${normalizePath(src)} <dim>${dest}</dim>`);
      await Deno.copyFile(pathFrom, pathTo);
    } catch {
      //Ignored
    }
  }

  /** Empty the dest folder */
  async clear() {
    await emptyDir(this.dest);
    this.#outputs.clear();
  }
}
