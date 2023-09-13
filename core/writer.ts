import { posix } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { concurrent, log, sha1 } from "./utils.ts";
import binaryLoader from "./loaders/binary.ts";

import type { Page, StaticFile } from "./filesystem.ts";

export interface Options {
  src: string;
  dest: string;
}

/**
 * Class to write the generated pages and static files
 * in the dest folder.
 */
export default class Writer {
  src: string;
  dest: string;
  #saveCount = 0;
  #outputs = new Map<string, [number, string, string]>();

  constructor(options: Options) {
    this.src = options.src;
    this.dest = options.dest;
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
    // Ignore empty files or without output path
    if (!page.outputPath) {
      return false;
    }
    // Ignore empty pages
    if (!page.content) {
      log.warning(
        `[Lume] <cyan>Skipped page</cyan> ${page.data.url} (file content is empty)`,
      );
      return false;
    }

    const { sourcePath, outputPath } = page;
    const id = outputPath.toLowerCase();
    const hash = await sha1(page.content);
    const previous = this.#outputs.get(id);
    this.#outputs.set(id, [this.#saveCount, sourcePath, hash]);

    if (previous) {
      const [previousCount, previousSourcePath, previousHash] = previous;

      if (previousCount === this.#saveCount) {
        throw new Error(
          `The pages ${sourcePath} and ${previousSourcePath} have the same output path "${outputPath}". Use distinct 'url' values to resolve the conflict.`,
        );
      }

      // The page content didn't change
      if (previousHash === hash) {
        return false;
      }
    }

    log.debug(`🔥 ${page.data.url} <dim>${sourcePath}</dim>`);

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
    const { entry } = file;

    if (entry.flags.has("saved")) {
      return false;
    }

    entry.flags.add("saved");

    const pathTo = posix.join(this.dest, file.outputPath);

    try {
      await ensureDir(posix.dirname(pathTo));

      if (entry.flags.has("remote")) {
        await Deno.writeFile(
          pathTo,
          (await entry.getContent(binaryLoader)).content as Uint8Array,
        );
      } else {
        // Copy file https://github.com/denoland/deno/issues/19425
        Deno.writeFileSync(pathTo, Deno.readFileSync(entry.src));
      }
      log.debug(
        `🔥 ${file.outputPath} <dim>${
          entry.flags.has("remote") ? entry.src : entry.path
        }</dim>`,
      );
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

  async removeFiles(files: string[]) {
    await concurrent(
      files,
      async (file) => {
        try {
          await Deno.remove(posix.join(this.dest, file));
        } catch {
          // Ignored
        }
      },
    );
  }
}
