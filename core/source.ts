import { posix } from "../deps/path.ts";
import { concurrent, normalizePath } from "./utils.ts";
import { Directory, Page, StaticFile } from "./filesystem.ts";

import type {
  Data,
  DataLoader,
  Formats,
  PageLoader,
  Reader,
  ScopeFilter,
} from "../core.ts";

export interface Options {
  formats: Formats;
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

  /** Info about how to handle different file formats */
  formats: Formats;

  /** The list of paths to ignore */
  ignored = new Set<string>();

  /** The path filters to ignore */
  filters: ScopeFilter[] = [];

  /** List of static files and folders to copy */
  staticPaths = new Map<
    string,
    string | ((path: string) => string) | undefined
  >();

  constructor(options: Options) {
    this.pageLoader = options.pageLoader;
    this.dataLoader = options.dataLoader;
    this.reader = options.reader;
    this.formats = options.formats;
  }

  addIgnoredPath(path: string) {
    this.ignored.add(normalizePath(path));
  }

  addIgnoreFilter(filter: ScopeFilter) {
    this.filters.push(filter);
  }

  addStaticPath(from: string, to?: string | ((path: string) => string)) {
    this.staticPaths.set(
      normalizePath(from),
      typeof to === "string" ? normalizePath(to) : to,
    );
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

  /** Returns all static files found */
  getStaticFiles(...filters: ((file: StaticFile) => boolean)[]): StaticFile[] {
    if (!this.root) {
      return [];
    }

    return [...this.root.getStaticFiles()].filter((page) =>
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
    // Check if the file should be ignored
    for (const path of this.ignored) {
      if (file === path || file.startsWith(path + "/")) {
        return;
      }
    }

    if (this.filters.some((filter) => filter(file))) {
      return;
    }

    // It's a static file
    for (const entry of this.staticPaths) {
      const [src, dest] = entry;

      if (file === src || file.startsWith(src + "/")) {
        const [directory] = await this.#getOrCreateDirectory(
          posix.dirname(src),
        );

        for (const staticFile of directory.staticFiles) {
          if (staticFile.src === file) {
            delete staticFile.saved;
            return;
          }
        }

        if (typeof dest === "string") {
          directory.setStaticFile({
            src: file,
            dest: posix.join(dest, file.slice(src.length)),
          });
        } else {
          const output = posix.join(
            directory.dest.path,
            file.slice(directory.src.path.length),
          );
          directory.setStaticFile({
            src: file,
            dest: dest ? dest(output) : output,
          });
        }

        return;
      }
    }

    // It's inside a _data file or directory
    const matches = file.match(/(.*)\/_data(?:\.\w+$|\/)/);

    if (matches) {
      const [directory, created] = await this.#getOrCreateDirectory(matches[1]);

      if (!created) {
        await this.#loadData(directory);
      }
    }

    // Any path segment starting with _ or .
    if (file.includes("/_") || file.includes("/.")) {
      return;
    }

    // Default
    return await this.#updateFile(file);
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
      name: posix.basename(file),
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    };

    const [directory] = await this.#getOrCreateDirectory(posix.dirname(file));
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

    const path = posix.join(directory.src.path, entry.name);

    // It's a static file/folder
    if (this.staticPaths.has(path)) {
      await this.#loadStaticFiles(directory, entry);
      return;
    }

    // Check if the file should be ignored
    if (this.ignored.has(path)) {
      return;
    }

    if (this.filters.some((filter) => filter(path))) {
      return;
    }

    if (entry.isFile) {
      const formatEntry = this.formats.search(path);

      if (!formatEntry) {
        return;
      }

      const [, format] = formatEntry;

      // The file is a static file
      if (format.copy) {
        const output = posix.join(directory.dest.path, entry.name);

        directory.setStaticFile({
          src: path,
          dest: typeof format.copy === "function"
            ? format.copy(output)
            : output,
        });
        return;
      }

      // The file is a page (a loadable file)
      if (format.pageLoader) {
        const page = (await this.pageLoader.load(path, formatEntry));

        if (page) {
          directory.setPage(entry.name, page);
        } else {
          directory.unsetPage(entry.name);
        }
      }
      return;
    }

    if (entry.isDirectory) {
      const [subDirectory] = await this.#getOrCreateDirectory(path);
      await this.#loadDirectory(subDirectory);
      return;
    }
  }

  /** Read the static files in a directory */
  async #loadStaticFiles(directory: Directory, entry: Deno.DirEntry) {
    const src = posix.join(directory.src.path, entry.name);

    if (!this.staticPaths.has(src)) {
      return;
    }

    await this.#scanStaticFiles(
      directory,
      entry,
      src,
      this.staticPaths.get(src),
    );
  }

  async #scanStaticFiles(
    directory: Directory,
    entry: Deno.DirEntry,
    src: string,
    dest?: string | ((file: string) => string),
  ) {
    // Check if the file should be ignored
    if (this.ignored.has(src)) {
      return;
    }

    if (this.filters.some((filter) => filter(src))) {
      return;
    }

    if (entry.isFile) {
      if (typeof dest === "string") {
        directory.setStaticFile({ src, dest });
      } else {
        const output = posix.join(
          directory.dest.path,
          src.slice(directory.src.path.length),
        );
        directory.setStaticFile({
          src,
          dest: dest ? dest(output) : output,
        });
      }
      return;
    }

    if (entry.isDirectory) {
      for await (const entry of this.reader.readDir(src)) {
        await this.#scanStaticFiles(
          directory,
          entry,
          posix.join(src, entry.name),
          typeof dest === "string" ? posix.join(dest, entry.name) : dest,
        );
      }
    }
  }

  /** Load the _data inside a directory */
  async #loadData(directory: Directory) {
    const data: Data = {};

    await concurrent(
      this.reader.readDir(directory.src.path),
      async (entry) => {
        const path = posix.join(directory.src.path, entry.name);

        if (this.ignored.has(path)) {
          return;
        }
        if (this.filters.some((filter) => filter(path))) {
          return;
        }

        if (entry.name === "_data" || /^_data\.\w+$/.test(entry.name)) {
          const dataFile = await this.dataLoader.load(path);
          Object.assign(data, dataFile);
        }
      },
    );

    Object.assign(directory.baseData, data);
  }
}
