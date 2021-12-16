import { Exception } from "./utils.ts";
import { join } from "../deps/path.ts";

import type { Data } from "./filesystem.ts";

/**
 * Class to read directories, files and store the content in a cache
 * It's used to avoid reading the same file multiple times
 */
export default class Reader {
  src: string;
  #cache = new Map<string, Promise<Data>>();

  constructor(src: string) {
    this.src = src;
  }

  /** Delete a file from the cache */
  deleteCache(path: string) {
    this.#cache.delete(path);
  }

  /** Delete all the cache */
  clearCache() {
    this.#cache.clear();
  }

  getFullPath(path: string): string {
    return join(this.src, path);
  }

  /** Returns the file info of a path */
  async getInfo(path: string): Promise<Deno.FileInfo | undefined> {
    try {
      return await Deno.stat(this.getFullPath(path));
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return;
      }

      throw err;
    }
  }

  /** Reads a directory */
  readDir(path: string): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(this.getFullPath(path));
  }

  /** Read a file using a loader and return the content */
  read(path: string, loader: Loader): Promise<Data> {
    const fullPath = this.getFullPath(path);

    try {
      if (!this.#cache.has(fullPath)) {
        this.#cache.set(fullPath, loader(fullPath));
      }

      return this.#cache.get(fullPath)!;
    } catch (cause) {
      throw new Exception("Couldn't load this file", { cause, fullPath });
    }
  }
}

/** A function that loads and returns the file content */
export type Loader = (path: string) => Promise<Data>;
