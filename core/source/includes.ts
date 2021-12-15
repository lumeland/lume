import { searchByExtension } from "../utils.ts";
import { join } from "../../deps/path.ts";

import type { Data, Loader } from "../../core.ts";
import type Reader from "../reader.ts";

/**
 * Class to load _includes files.
 */
export default class IncludesLoader {
  /** The filesystem reader */
  reader: Reader;

  /** Default includes directory */
  defaultDir = "_includes";

  /** To store the includes paths by extension */
  includes = new Map<string, string>();

  /** List of extensions to load files and the loader used */
  loaders = new Map<string, Loader>();

  constructor(reader: Reader) {
    this.reader = reader;
  }

  async load(path: string): Promise<[string, Data] | undefined> {
    const result = searchByExtension(path, this.loaders);

    if (!result) {
      return;
    }

    const [ext, loader] = result;

    const includesPath = join(
      this.includes.get(ext) || this.defaultDir,
      path,
    );

    return [
      includesPath,
      await this.reader.read(includesPath, loader),
    ];
  }
}
