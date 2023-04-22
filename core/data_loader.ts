import { posix } from "../deps/path.ts";
import { isPlainObject } from "./utils.ts";

import type { Entry } from "./fs.ts";
import type { Data, Formats, Reader } from "../core.ts";

export interface Options {
  /** The reader instance used to read the files */
  reader: Reader;

  /** The registered file formats */
  formats: Formats;
}

/**
 * Class to load data files.
 */
export default class DataLoader {
  /** The filesystem reader */
  reader: Reader;

  /** List of extensions to load data files and the loader used */
  formats: Formats;

  constructor(options: Options) {
    this.reader = options.reader;
    this.formats = options.formats;
  }

  load(entry: Entry): Promise<Data | undefined> {
    if (entry.type === "directory") {
      return this.#loadDirectory(entry);
    }

    return this.#loadFile(entry);
  }

  /** Load a _data.* file */
  async #loadFile(entry: Entry): Promise<Data | undefined> {
    const format = this.formats.search(entry.path);

    if (!format) {
      return;
    }

    if (!format.dataLoader) {
      return;
    }

    return await entry.getContent(format.dataLoader);
  }

  /** Load a _data directory */
  async #loadDirectory(entry: Entry): Promise<Data> {
    const data: Data = {};

    for await (const child of Object.values(entry.children || {})) {
      await this.loadEntry(child, data);
    }

    return data;
  }

  /**
   * Load a data entry inside a _data directory
   * and append the data to the data object
   */
  async loadEntry(entry: Entry, data: Data) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) {
      return;
    }

    if (entry.type === "file") {
      const name = posix.basename(entry.name, posix.extname(entry.name));
      const fileData = await this.#loadFile(entry) || {};

      if (fileData.content && Object.keys(fileData).length === 1) {
        data[name] = fileData.content;
      } else {
        const target = data[name] as Record<string, unknown> | undefined;
        if (isPlainObject(fileData) || target) {
          data[name] = Object.assign(target || {}, fileData);
        } else {
          data[name] = fileData;
        }
      }

      return;
    }

    if (entry.type === "directory") {
      data[entry.name] = await this.#loadDirectory(entry);
    }
  }
}
