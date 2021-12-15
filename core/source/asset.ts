import { searchByExtension } from "../utils.ts";
import { Page } from "../filesystem.ts";

import type { Loader } from "../../core.ts";
import type Reader from "../reader.ts";

/**
 * Class to load page files that generate assets (css, js, etc).
 */
export default class AssetLoader {
  /** The filesystem reader */
  reader: Reader;

  /** List of extensions to load page files and the loader used */
  loaders = new Map<string, Loader>();

  constructor(reader: Reader) {
    this.reader = reader;
  }

  /** Load an asset Page */
  async load(path: string): Promise<Page | undefined> {
    const result = searchByExtension(path, this.loaders);

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
