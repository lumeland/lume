import { join } from "../deps/path.ts";
import Extensions from "./extensions.ts";

import type { Data } from "./filesystem.ts";
import type { default as Reader, Loader } from "./reader.ts";

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

  /** To use different includes paths by extension */
  paths: Extensions<string>;

  /** List of extensions to load files and the loader used */
  loaders = new Extensions<Loader>();

  constructor(options: Options) {
    this.reader = options.reader;
    this.paths = new Extensions<string>(options.includes);
  }

  async load(path: string): Promise<[string, Data] | undefined> {
    const result = this.loaders.search(path);

    if (!result) {
      return;
    }

    const [, loader] = result;
    const entry = this.paths.search(path)!;
    const includesPath = join(entry[1], path);

    return [
      includesPath,
      await this.reader.read(includesPath, loader),
    ];
  }
}
