import { basename, dirname, join } from "../deps/path.ts";
import { concurrent, normalizePath } from "./utils.ts";
import { Directory, Page } from "./filesystem.ts";

import type PageLoader from "./page_loader.ts";
import type AssetLoader from "./asset_loader.ts";
import type DataLoader from "./data_loader.ts";
import type Reader from "./reader.ts";

export interface Options {
  dataLoader: DataLoader;
  pageLoader: PageLoader;
  assetLoader: AssetLoader;
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

  /** To load all HTML pages */
  pageLoader: PageLoader;

  /** To load all non-HTML pages */
  assetLoader: AssetLoader;

  /** The list of paths to ignore */
  ignored = new Set<string>();

  constructor(options: Options) {
    this.pageLoader = options.pageLoader;
    this.assetLoader = options.assetLoader;
    this.dataLoader = options.dataLoader;
    this.reader = options.reader;
  }

  /**
   * Refresh the cache
   * Used on update files
   */
  clearCache() {
    this.root?.refreshCache();
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
  load() {
    this.root = new Directory({ path: "/" });
    return this.#loadDirectory(this.root);
  }

  /** Reload a file */
  async reload(file: string): Promise<void> {
    // It's an ignored file
    if (this.#isIgnored(file)) {
      return;
    }

    const normalized = normalizePath(file);

    // It's inside a _data file or directory
    if (/\/_data(?:\.\w+$|\/)/.test(normalized)) {
      return await this.#reloadFile(normalized);
    }

    // Any path segment starts with _ or .
    if (normalized.includes("/_") || normalized.includes("/.")) {
      return;
    }

    // Default
    return await this.#reloadFile(normalized);
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

  /* Check if a file is in the ignored list */
  #isIgnored(path: string) {
    for (const pattern of this.ignored) {
      if (pattern === path || path.startsWith(`${pattern}/`)) {
        return true;
      }
    }

    return false;
  }

  /** Loads a directory recursively */
  #loadDirectory(directory: Directory) {
    return concurrent(
      this.reader.readDir(directory.src.path),
      (entry) => this.#loadEntry(directory, entry),
    );
  }

  /** Reloads a file */
  async #reloadFile(file: string) {
    const entry = {
      name: basename(file),
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    };

    // Is a file inside a _data directory
    if (file.includes("/_data/")) {
      const [dir, remain] = file.split("/_data/", 2);
      const directory = await this.#getOrCreateDirectory(dir);
      const path = dirname(remain).split("/").filter((name: string) =>
        name && name !== "."
      );
      let data = directory.data as Record<string, unknown>;

      for (const name of path) {
        if (!(name in data)) {
          data[name] = {};
        }

        data = data[name] as Record<string, unknown>;
      }

      return await this.dataLoader.loadEntry(
        join(dirname(file)),
        entry,
        data,
      );
    }

    const directory = await this.#getOrCreateDirectory(dirname(file));
    await this.#loadEntry(directory, entry);
  }

  /** Get an existing directory. Create it if it doesn't exist */
  async #getOrCreateDirectory(path: string): Promise<Directory> {
    let dir: Directory;

    if (this.root) {
      dir = this.root;
    } else {
      dir = this.root = new Directory({ path: "/" });

      await concurrent(
        this.reader.readDir(dir.src.path),
        (entry) => this.#loadEntry(dir, entry, true),
      );
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

      await concurrent(
        this.reader.readDir(dir.src.path),
        (entry) => this.#loadEntry(dir, entry, true),
      );
    }

    return dir;
  }

  /** Load an entry from a directory */
  async #loadEntry(
    directory: Directory,
    entry: Deno.DirEntry,
    onlyData = false,
  ) {
    if (entry.isSymlink || entry.name.startsWith(".")) {
      return;
    }

    const path = join(directory.src.path, entry.name);

    if (this.ignored.has(path)) {
      return;
    }

    if (entry.isDirectory && entry.name === "_data") {
      directory.addData(await this.dataLoader.loadDirectory(path));
      return;
    }

    if (entry.isFile && /^_data\.\w+$/.test(entry.name)) {
      directory.addData(await this.dataLoader.load(path) || {});
      return;
    }

    if (onlyData || entry.name.startsWith("_")) {
      return;
    }

    if (entry.isFile) {
      const page = (await this.pageLoader.load(path)) ??
        (await this.assetLoader.load(path));

      if (page) {
        directory.setPage(entry.name, page);
      } else {
        directory.unsetPage(entry.name);
      }
      return;
    }

    if (entry.isDirectory) {
      const subDirectory = directory.createDirectory(entry.name);
      await this.#loadDirectory(subDirectory);
      return;
    }
  }
}
