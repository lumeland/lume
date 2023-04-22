import { posix } from "../deps/path.ts";
import { Exception } from "./errors.ts";

import type { Data, Format, FS } from "../core.ts";

export interface Options {
  /** The filesystem instance used to read the files */
  fs: FS;

  /** The default _includes directory */
  includes: string;
}

/**
 * Class to load _includes files.
 */
export default class IncludesLoader {
  /** The filesystem reader */
  fs: FS;

  /** Default _includes path */
  includes: string;

  constructor(options: Options) {
    this.fs = options.fs;
    this.includes = options.includes;
  }

  resolve(path: string, format: Format, from?: string): string | undefined {
    let finalPath: string;

    if (path.startsWith(".")) {
      if (!from) {
        throw new Exception(`Cannot load "${path}" without a base path`, {
          path,
        });
      }

      finalPath = posix.join("/", posix.dirname(from), path);
    } else {
      finalPath = posix.join("/", format.includesPath || this.includes, path);
    }

    return finalPath;
  }

  async load(
    path: string,
    format: Format,
    from?: string,
  ): Promise<[string, Data] | undefined> {
    const finalPath = this.resolve(path, format, from);

    if (!finalPath || !format.pageLoader) {
      return;
    }

    const entry = this.fs.entries.get(finalPath);

    if (!entry) {
      return;
    }

    return [finalPath, await entry.getContent(format.pageLoader)];
  }
}
