import { basename, dirname, join } from "../deps/path.ts";
import { concurrent, normalizePath } from "./utils.ts";
import { Directory, Page } from "./filesystem.ts";

import type { Data, DataLoader, PageLoader, Reader } from "../core.ts";

export interface Options {
  dataLoader: DataLoader;
  pageLoader: PageLoader;
  reader: Reader;
}

/**
 * Scan and load files from the source folder
 * with the data, pages, assets and static files
 */
export default class Source {
  /** The root of the src directory */
  root?: Directory;

  /** Filesystem reader to scan folders */
  reader: Reader;

  /** To load all _data files */
  dataLoader: DataLoader;

  /** To load all resources (HTML pages and assets) */
  pageLoader: PageLoader;

  /** The list of paths to ignore */
  ignored = new Set<string>();

  constructor(options: Options) {
    this.pageLoader = options.pageLoader;
    this.dataLoader = options.dataLoader;
    this.reader = options.reader;
  }

  addIgnoredPath(path: string) {
    this.ignored.add(join("/", path));
  }

  /** Returns all pages found */
  getPages(...filters: ((page: Page) => boolean)[]): Page[] {
    if (!this.root) {
      return [];
    }

    return [...this.root.getPages()].filter((page) =>
      filters.every((filter) => filter(page))
    );
  }

  /** Load all sources */
  async load() {
    const [root] = await this.#getOrCreateDirectory("/");
    return this.#loadDirectory(root);
  }

  /** Update a file */
  async update(file: string): Promise<void> {
    // Check if the file is in the list of ignored paths
    for (const path of this.ignored) {
      if (file === path || file.startsWith(join(path, "/"))) {
        return;
      }
    }

    const normalized = normalizePath(file);

    // It's inside a _data file or directory
    const matches = normalized.match(/(.*)\/_data(?:\.\w+$|\/)/);

    if (matches) {
      const [directory, created] = await this.#getOrCreateDirectory(matches[1]);

      if (!created) {
        await this.#loadData(directory);
      }
    }

    // Any path segment starting with _ or .
    if (normalized.includes("/_") || normalized.includes("/.")) {
      return;
    }

    // Default
    return await this.#updateFile(normalized);
  }

  /** Return the File or Directory of a path */
  getFileOrDirectory(path: string): Directory | Page | undefined {
    let result: Directory | Page | undefined = this.root;

    path.split("/").forEach((name) => {
      if (!name || !result) {
        return;
      }

      if (result instanceof Directory) {
        result = result.dirs.get(name) || result.pages.get(name);
      }
    });

    return result;
  }

  /** Loads a directory recursively */
  #loadDirectory(directory: Directory) {
    return concurrent(
      this.reader.readDir(directory.src.path),
      (entry) => this.#loadEntry(directory, entry),
    );
  }

  /** Reloads a file */
  async #updateFile(file: string) {
    const entry = {
      name: basename(file),
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    };

    const [directory] = await this.#getOrCreateDirectory(dirname(file));
    await this.#loadEntry(directory, entry);
  }

  /** Get an existing directory or create it if it doesn't exist */
  async #getOrCreateDirectory(path: string): Promise<[Directory, boolean]> {
    let dir: Directory;
    let created = false;

    if (this.root) {
      dir = this.root;
    } else {
      dir = this.root = new Directory({ path: "/" });
      await this.#loadData(dir);
    }

    for (const name of path.split("/")) {
      if (!name) {
        continue;
      }

      if (dir.dirs.has(name)) {
        dir = dir.dirs.get(name)!;
        continue;
      }

      dir = dir.createDirectory(name);
      await this.#loadData(dir);
      created = true;
    }

    return [dir, created];
  }

  /** Load an entry from a directory */
  async #loadEntry(directory: Directory, entry: Deno.DirEntry) {
    if (
      entry.isSymlink || entry.name.startsWith(".") ||
      entry.name.startsWith("_")
    ) {
      return;
    }

    const path = join(directory.src.path, entry.name);

    if (this.ignored.has(path)) {
      return;
    }

    if (entry.isFile) {
      const page = (await this.pageLoader.load(path));

      if (page) {
        directory.setPage(entry.name, page);
      } else {
        directory.unsetPage(entry.name);
      }
      return;
    }

    if (entry.isDirectory) {
      const [subDirectory] = await this.#getOrCreateDirectory(path);
      await this.#loadDirectory(subDirectory);
      return;
    }
  }

  /** Load the _data inside a directory */
  async #loadData(directory: Directory) {
    const data: Data = {};

    await concurrent(
      this.reader.readDir(directory.src.path),
      async (entry) => {
        const path = join(directory.src.path, entry.name);

        if (this.ignored.has(path)) {
          return;
        }

        if (entry.name === "_data" || /^_data\.\w+$/.test(entry.name)) {
          const dataFile = await this.dataLoader.load(path);
          Object.assign(data, dataFile);
        }
      },
    );

    directory.baseData = data;
  }
}
