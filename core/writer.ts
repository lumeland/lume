import { posix } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { concurrent, read, sha1 } from "./utils.ts";
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
    // Ignore empty files or with url === false
    if (page.data.url === false) {
      return false;
    }
    // Ignore empty pages
    if (!page.content) {
      this.logger.warn(
        `Skipped page ${page.data.url} (file content is empty)`,
      );
      return false;
    }

    const src = page.src.remote
      ? page.src.remote
      : page.src.path
      ? page.src.path + (page.src.ext || "")
      : "(generated)";
    const { outputPath } = page;
    const id = outputPath.toLowerCase();
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
            outputPath,
          },
        );
      }

      // The page content didn't change
      if (previousHash === hash) {
        return false;
      }
    }

    this.logger.log(`🔥 ${page.data.url} <dim>${src}</dim>`);

    const filename = posix.join(this.dest, outputPath);
    await ensureDir(posix.dirname(filename));

    page.content instanceof Uint8Array
      ? await Deno.writeFile(filename, page.content)
      : await Deno.writeTextFile(filename, page.content);

    return true;
  }

  /**
   * Copy the static files in the dest folder
   */
  async copyFiles(files: StaticFile[]): Promise<StaticFile[]> {
    const copyFiles: StaticFile[] = [];

    await concurrent(
      files,
      async (file) => {
        if (await this.copyFile(file)) {
          copyFiles.push(file);
        }
      },
    );

    return copyFiles;
  }

  /**
   * Copy a static file in the dest folder
   * Returns a boolean indicating if the file has saved
   */
  async copyFile(file: StaticFile): Promise<boolean> {
    if (file.saved) {
      return false;
    }

    file.saved = true;
    const pathTo = posix.join(this.dest, file.url!);

    // The file was removed
    if (file.removed) {
      try {
        await Deno.remove(pathTo);
        this.logger.log(`  <del>${file.url}</del>`);
      } catch {
        // Ignored
      }
      return false;
    }

    try {
      await ensureDir(posix.dirname(pathTo));
      let { src } = file;
      if (file.remote) {
        const content = await read(file.remote, true);
        await Deno.writeFile(pathTo, content);
        src = file.remote;
      } else {
        const pathFrom = posix.join(this.src, file.src);
        await Deno.copyFile(pathFrom, pathTo);
      }
      this.logger.log(`🔥 ${file.url} <dim>${src}</dim>`);
      return true;
    } catch {
      // Ignored
    }

    return false;
  }

  /** Empty the dest folder */
  async clear() {
    await emptyDir(this.dest);
    this.#outputs.clear();
  }
}
