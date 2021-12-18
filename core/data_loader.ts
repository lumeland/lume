import { basename, extname, join } from "../deps/path.ts";
import Extensions from "./extensions.ts";

import type { Data, Loader, Reader } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;
}

/**
 * Class to load data files.
 */
export default class DataLoader {
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

  async load(path: string): Promise<Data | undefined> {
    const info = await this.reader.getInfo(path);

    if (!info) {
      return;
    }

    if (info.isDirectory) {
      return this.#loadDirectory(path);
    }

    return this.#loadFile(path);
  }

  /** Load a _data.* file */
  async #loadFile(path: string): Promise<Data | undefined> {
    const result = this.loaders.search(path);

    if (!result) {
      return;
    }

    const [, loader] = result;

    const data = await this.reader.read(path, loader);

    // Ensure the the tags is string[]
    if (data.tags) {
      data.tags = Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag))
        : [String(data.tags)];
    }

    return data;
  }

  /** Load a _data directory */
  async #loadDirectory(path: string): Promise<Data> {
    const data: Data = {};

    for await (const entry of this.reader.readDir(path)) {
      await this.loadEntry(path, entry, data);
    }

    return data;
  }

  /**
   * Load a data entry inside a _data directory
   * and append the data to the data object
   */
  async loadEntry(path: string, entry: Deno.DirEntry, data: Data) {
    if (
      entry.isSymlink ||
      entry.name.startsWith(".") || entry.name.startsWith("_")
    ) {
      return;
    }

    if (entry.isFile) {
      const name = basename(entry.name, extname(entry.name));
      const fileData = await this.#loadFile(join(path, entry.name)) || {};

      if (fileData.content && Object.keys(fileData).length === 1) {
        data[name] = fileData.content;
      } else {
        data[name] = Object.assign(data[name] || {}, fileData);
      }

      return;
    }

    if (entry.isDirectory) {
      data[entry.name] = await this.#loadDirectory(join(path, entry.name));
    }
  }
}
