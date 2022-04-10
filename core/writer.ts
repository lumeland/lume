import { basename, dirname, join, resolve } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { concurrent, normalizePath, sha1 } from "./utils.ts";
import { Exception } from "./errors.ts";

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
  async copyFile(from: string, to: string) {
    const pathFrom = join(this.src, from);
    const pathTo = join(this.dest, to);

    try {
      await ensureDir(dirname(pathTo));
      this.logger.log(`🔥 ${normalizePath(to)} <dim>${from}</dim>`);
      return copy(pathFrom, pathTo);
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

/**
 * The following code is a modified version of the deprecated std/fs/copy.
 *
 * Source: https://deno.land/std@0.134.0/fs/copy.ts
 * Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
 */

async function ensureValidCopy(
  src: string,
  dest: string,
  isDirectory = false,
): Promise<Deno.FileInfo | undefined> {
  let destStat: Deno.FileInfo;

  try {
    destStat = await Deno.lstat(dest);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }

  if (isDirectory && !destStat.isDirectory) {
    throw new Error(
      `Cannot overwrite non-directory '${dest}' with directory '${src}'.`,
    );
  }

  return destStat;
}

/* copy file to dest */
async function copyFile(src: string, dest: string) {
  await ensureValidCopy(src, dest);
  await Deno.copyFile(src, dest);
}

/* copy symlink to dest */
async function copySymLink(src: string, dest: string) {
  await ensureValidCopy(src, dest);
  const originSrcFilePath = await Deno.readLink(src);
  const info = await Deno.lstat(src);

  if (Deno.build.os === "windows") {
    await Deno.symlink(originSrcFilePath, dest, {
      type: info.isDirectory ? "dir" : "file",
    });
  } else {
    await Deno.symlink(originSrcFilePath, dest);
  }
}

/* copy folder from src to dest. */
async function copyDir(src: string, dest: string) {
  const destStat = await ensureValidCopy(src, dest, true);

  if (!destStat) {
    await ensureDir(dest);
  }

  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, basename(srcPath as string));

    if (entry.isSymlink) {
      await copySymLink(srcPath, destPath);
    } else if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile) {
      await copyFile(srcPath, destPath);
    }
  }
}

/* Copy a file or directory, like `cp -r`. */
export async function copy(src: string, dest: string) {
  src = resolve(src);
  dest = resolve(dest);

  if (src === dest) {
    throw new Error("Source and destination cannot be the same.");
  }

  try {
    const srcStat = await Deno.lstat(src);

    if (srcStat.isDirectory && dest.startsWith(src)) {
      throw new Error(
        `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`,
      );
    }

    if (srcStat.isSymlink) {
      await copySymLink(src, dest);
    } else if (srcStat.isDirectory) {
      await copyDir(src, dest);
    } else if (srcStat.isFile) {
      await copyFile(src, dest);
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false;
    }

    throw err;
  }
}
