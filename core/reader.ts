import { Exception } from "./errors.ts";
import { posix } from "../deps/path.ts";

import type { Data } from "../core.ts";

export interface Options {
  /** The root directory of the files */
  src: string;
}

/**
 * Class to read directories, files and store the content in a cache
 * It's used to avoid reading the same file multiple times
 */
export default class Reader {
  src: string;
  cache = new Map<string, Promise<Data>>();
  remoteFiles = new Map<string, string>();

  constructor(options: Options) {
    this.src = options.src;
  }

  /** Register a remote file */
  remoteFile(filename: string, url: string) {
    this.remoteFiles.set(this.getFullPath(filename), url);
  }

  /** Delete a file from the cache */
  deleteCache(path: string) {
    const fullPath = this.getFullPath(path);
    this.cache.delete(fullPath);
  }

  /** Delete all the cache */
  clearCache() {
    this.cache.clear();
  }

  getFullPath(path: string): string {
    const fullPath = posix.join(this.src, path);

    return fullPath.endsWith("/") ? fullPath.slice(0, -1) : fullPath;
  }

  /** Returns the file info of a path */
  async getInfo(path: string): Promise<Deno.FileInfo | undefined> {
    const fullPath = this.getFullPath(path);

    try {
      return await Deno.stat(fullPath);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        // Is a remote file
        if (this.remoteFiles.has(fullPath)) {
          return createFileInfo();
        }

        // Is a remote folder
        for (const file of this.remoteFiles.keys()) {
          if (file.startsWith(fullPath + "/")) {
            return createFileInfo(false);
          }
        }
        return;
      }

      throw err;
    }
  }

  /** Reads a directory */
  async *readDir(path: string): AsyncIterable<Deno.DirEntry> {
    const fullPath = this.getFullPath(path);
    const read = new Set<string>();

    // Read real files
    try {
      for await (const entry of Deno.readDir(this.getFullPath(path))) {
        read.add(entry.name);
        yield entry;
      }
    } catch {
      // Ignore
    }

    // Read remote files
    for (const file of this.remoteFiles.keys()) {
      if (!file.startsWith(fullPath)) {
        continue;
      }

      const rest = file.slice(fullPath.length + 1);
      const name = rest.split("/")[0];
      const isFile = rest === name;

      if (read.has(name)) {
        continue;
      }

      read.add(name);

      yield {
        name,
        isFile,
        isDirectory: !isFile,
        isSymlink: false,
      };
    }
  }

  /** Read a file using a loader and return the content */
  async read(path: string, loader: Loader): Promise<Data> {
    const fullPath = this.getFullPath(path);
    const remoteUrl = this.remoteFiles.get(fullPath);
    let loadPath = fullPath;

    // If exists as remote, check if there's a local version
    if (remoteUrl) {
      try {
        await Deno.stat(fullPath);
      } catch {
        // The file doesn't exist locally, use the remote one
        loadPath = remoteUrl;
      }
    }

    try {
      if (!this.cache.has(fullPath)) {
        this.cache.set(fullPath, loader(loadPath));
      }

      return await this.cache.get(fullPath)!;
    } catch (cause) {
      throw new Exception("Couldn't load this file", { cause, fullPath });
    }
  }
}

/** A function that loads and returns the file content */
export type Loader = (path: string) => Promise<Data>;

function createFileInfo(isFile = true): Deno.FileInfo {
  return {
    isFile,
    isDirectory: !isFile,
    isSymlink: false,
    size: 0,
    mtime: null,
    atime: null,
    birthtime: null,
    dev: null,
    ino: null,
    mode: null,
    nlink: null,
    uid: null,
    gid: null,
    rdev: null,
    blksize: null,
    blocks: null,
  };
}
