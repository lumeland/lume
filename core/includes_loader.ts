import { posix } from "../deps/path.ts";
import { Exception } from "./errors.ts";

import type { Data, Format, Reader } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;

  /** The default _includes directory */
  includes: string;
}

/**
 * Class to load _includes files.
 */
export default class IncludesLoader {
  /** The filesystem reader */
  reader: Reader;

  /** Default _includes path */
  includes: string;

  constructor(options: Options) {
    this.reader = options.reader;
    this.includes = options.includes;
  }

  async load(
    path: string,
    format: Format,
    from?: string,
  ): Promise<[string, Data] | undefined> {
    if (!format.pageLoader) {
      return;
    }

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

    return [
      finalPath,
      await this.reader.read(finalPath, format.pageLoader),
    ];
  }
}
