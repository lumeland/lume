import { Page } from "./filesystem.ts";
import Extensions from "./extensions.ts";
import { join } from "../deps/path.ts";

import type { Data, Loader, Reader } from "../core.ts";

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

  /** Assign a loader to some extensions */
  set(extensions: string[], loader: Loader) {
    extensions.forEach((extension) => this.loaders.set(extension, loader));
  }

  /** Load an asset Page */
  async load(path: string): Promise<Page | undefined> {
    path = join("/", path);
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

    page.data = await this.loadData(page, path, loader);

    return page;
  }

  /** Loads the page data and prepare it */
  async loadData(_page: Page, path: string, loader: Loader): Promise<Data> {
    const data = await this.reader.read(path, loader);

    if (data.tags) {
      data.tags = Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag))
        : [String(data.tags)];
    }

    return data;
  }
}
