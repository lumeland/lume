import { join } from "../deps/path.ts";
import Extensions from "./extensions.ts";

import type { Data, Loader, Reader } from "../core.ts";

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

  /** Assign a loader to some extensions */
  set(extensions: string[], loader: Loader) {
    extensions.forEach((extension) => this.loaders.set(extension, loader));
  }

  /** Assign a path to some extensions */
  setPath(extensions: string[], path: string) {
    extensions.forEach((extension) => this.paths.set(extension, path));
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
