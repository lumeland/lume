import { dirname, join } from "../deps/path.ts";
import { copy, emptyDir, ensureDir } from "../deps/fs.ts";
import { normalizePath, sha1 } from "./utils.ts";

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

  /** Save a page in the dest folder */
  async savePage(page: Page) {
    // Ignore empty files
    if (!page.content) {
      return;
    }

    const dest = page.dest.path + page.dest.ext;
    const hash = await sha1(page.content);
    const previousHash = this.#hashes.get(dest);

    // The page content didn't change
    if (previousHash === hash) {
      return;
    }

    this.#hashes.set(dest, hash);

    const src = page.src.path
      ? page.src.path + (page.src.ext || "")
      : "(generated)";
    this.logger.log(`🔥 ${dest} <dim>${src}</dim>`);

    const filename = join(this.dest, dest);
    await ensureDir(dirname(filename));

    page.content instanceof Uint8Array
      ? await Deno.writeFile(filename, page.content)
      : await Deno.writeTextFile(filename, page.content);
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
