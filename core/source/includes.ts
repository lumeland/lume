import { join } from "../../deps/path.ts";
import Extensions from "../extensions.ts";

import type { Data } from "../filesystem.ts";
import type { default as Reader, Loader } from "../reader.ts";

/**
 * Class to load _includes files.
 */
export default class IncludesLoader {
  /** The filesystem reader */
  reader: Reader;

  /** To use different includes paths by extension */
  paths = new Extensions<string>("_includes");

  /** List of extensions to load files and the loader used */
  loaders = new Extensions<Loader>();

  constructor(reader: Reader) {
    this.reader = reader;
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
