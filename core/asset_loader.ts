import { Page } from "./filesystem.ts";
import Extensions from "./extensions.ts";

import type { default as Reader, Loader } from "./reader.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;
}

/**
 * Class to load page files that generate assets (css, js, etc).
 */
export default class AssetLoader {
  /** The filesystem reader */
  reader: Reader;

  /** List of extensions to load page files and the loader used */
  loaders = new Extensions<Loader>();

  constructor(options: Options) {
    this.reader = options.reader;
  }

  /** Load an asset Page */
  async load(path: string): Promise<Page | undefined> {
    const result = this.loaders.search(path);

    if (!result) {
      return;
    }

    const [ext, loader] = result;
    const info = await this.reader.getInfo(path);

    if (!info) {
      return;
    }

    const page = new Page({
      path: path.slice(0, -ext.length),
      lastModified: info?.mtime || undefined,
      created: info?.birthtime || undefined,
      ext,
    });

    page.data = await this.reader.read(path, loader);

    return page;
  }
}
