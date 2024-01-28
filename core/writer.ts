import { posix } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { concurrent } from "./utils/concurrent.ts";
import { sha1 } from "./utils/digest.ts";
import { log } from "./utils/log.ts";
import binaryLoader from "./loaders/binary.ts";

import type { Page, StaticFile } from "./file.ts";
import type { Entry } from "./fs.ts";

export interface Options {
  dest: string;
}

/** Generic interface for Writer */
export interface Writer {
  savePages(pages: Page[]): Promise<Page[]>;
  copyFiles(files: StaticFile[]): Promise<StaticFile[]>;
  clear(): Promise<void>;
  removeFiles(files: string[]): Promise<void>;
}

const fmt = ({ from, to }: { from: string; to: string }) =>
  `🔥 ${to} <dim>${from}</dim>`;

class BaseWritter {
  #saveCount = 0;
  #outputs = new Map<string, [number, string, string]>();

  incrementSaveCount() {
    ++this.#saveCount;
  }

  clearOutputs() {
    this.#outputs.clear();
  }

  async checkPage(page: Page): Promise<boolean> {
    const { sourcePath, outputPath, content } = page;
    // Ignore empty pages
    if (!content) {
      log.warn(
        `[Lume] <cyan>Skipped page</cyan> ${page.data.url} (file content is empty)`,
      );
      return false;
    }

    const id = outputPath.toLowerCase();
    const hash = await sha1(content);
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

    log.info(fmt({ from: sourcePath, to: page.data.url }));
    return true;
  }
}

/**
 * Class to write the generated pages and static files
 * in the dest folder.
 */
export class FSWriter extends BaseWritter implements Writer {
  dest: string;

  constructor(options: Options) {
    super();
    this.dest = options.dest;
  }

  /**
   * Save the pages in the dest folder
   * Returns an array of pages that have been saved
   */
  async savePages(pages: Page[]): Promise<Page[]> {
    const savedPages: Page[] = [];
    this.incrementSaveCount();

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
    if (!await this.checkPage(page)) {
      return false;
    }

    const filename = posix.join(this.dest, page.outputPath);
    await ensureDir(posix.dirname(filename));

    page.content instanceof Uint8Array
      ? await Deno.writeFile(filename, page.content)
      : await Deno.writeTextFile(filename, page.content as string);

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
      log.info(fmt({
        from: entry.flags.has("remote") ? entry.src : entry.path,
        to: file.outputPath,
      }));
      return true;
    } catch {
      // Ignored
    }

    return false;
  }

  /** Empty the dest folder */
  async clear() {
    await emptyDir(this.dest);
    this.clearOutputs();
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

export class PreviewWriter extends BaseWritter implements Writer {
  files = new Map<string, string | Uint8Array | Entry>();

  async savePages(pages: Page[]) {
    this.incrementSaveCount();
    const saved: Page[] = [];

    for (const page of pages) {
      if (await this.checkPage(page)) {
        this.files.set(page.outputPath, page.content!);
        saved.push(page);
      }
    }

    return pages;
  }

  copyFiles(files: StaticFile[]) {
    const copied: StaticFile[] = [];

    for (const file of files) {
      const { entry, outputPath } = file;
      if (entry.flags.has("saved")) {
        continue;
      }

      entry.flags.add("saved");
      this.files.set(outputPath, entry);
      copied.push(file);
      log.info(fmt({
        from: entry.flags.has("remote") ? entry.src : entry.path,
        to: file.outputPath,
      }));
    }

    return Promise.resolve(copied);
  }

  clear() {
    return Promise.resolve();
  }

  removeFiles(files: string[]) {
    for (const file of files) {
      this.files.delete(file);
    }
    return Promise.resolve();
  }
}
