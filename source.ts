import Site from "./site.ts";
import { basename, dirname, extname, join } from "./deps/path.ts";
import { existsSync } from "./deps/fs.ts";
import { Directory, Page } from "./filesystem.ts";
import {
  concurrent,
  Exception,
  normalizePath,
  searchByExtension,
} from "./utils.ts";
import {
  Data,
  Directory as iDirectory,
  Event,
  Loader,
  Page as iPage,
  Source as iSource,
} from "./types.ts";

/**
 * Class to scan and load files from the source folder
 * with the data, pages, assets and static files
 */
export default class Source implements iSource {
  site: Site;
  root = new Directory({ path: "/" });

  data: Map<string, Loader> = new Map();
  pages: Map<string, Loader> = new Map();
  staticFiles: Map<string, string> = new Map();
  assets: Set<string> = new Set();
  ignored: Set<string> = new Set();
  #cache: Map<string, Promise<Data>> = new Map();

  constructor(site: Site) {
    this.site = site;

    // Update cache
    site.addEventListener("beforeBuild", () => {
      this.root.refreshCache();
      this.#cache.clear();
    });

    site.addEventListener("beforeUpdate", (ev: Event) => {
      this.root.refreshCache();

      for (const filename of ev.files!) {
        this.#cache.delete(site.src(filename));
      }
    });
  }

  /**
   * Returns the Directory instance of a path
   * and create if it doesn't exist
   */
  getOrCreateDirectory(path: string) {
    let dir: iDirectory = this.root;

    path.split("/").forEach((name) => {
      if (!name || !dir) {
        return;
      }

      if (!dir.dirs.has(name)) {
        dir.createDirectory(name);
      }

      dir = dir.dirs.get(name)!;
    });

    return dir;
  }

  /**
   * Returns the File or Directory of a path
   */
  getFileOrDirectory(path: string): iDirectory | iPage | undefined {
    let result: iDirectory | iPage | undefined = this.root;

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

  /**
   * Check whether a file is included in the static files
   * and return the [from, to] tupple
   */
  isStatic(file: string) {
    for (const entry of this.staticFiles) {
      const [from] = entry;

      if (file.startsWith(from)) {
        return entry;
      }
    }

    return false;
  }

  /**
   * Check whether a path is ignored or not
   */
  isIgnored(path: string) {
    for (const pattern of this.ignored) {
      if (pattern === path || path.startsWith(`${pattern}/`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Load a directory recursively
   */
  loadDirectory(directory: iDirectory = this.root) {
    const path = this.site.src(directory.src.path);

    return concurrent(
      Deno.readDir(path),
      (entry) => this.#loadEntry(directory, entry),
    );
  }

  /**
   * Reload some files
   */
  async loadFile(file: string) {
    const entry = {
      name: basename(file),
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    };

    file = normalizePath(file);

    // Is a file inside _data directory
    if (file.includes("/_data/")) {
      const [dir, remain] = file.split("/_data/", 2);
      const directory = this.getOrCreateDirectory(dir);
      const path = dirname(remain).split("/").filter((name) =>
        name && name !== "."
      );
      let data = directory.data as Record<string, unknown>;

      for (const name of path) {
        if (!(name in data)) {
          data[name] = {};
        }

        data = data[name] as Record<string, unknown>;
      }

      return await this.#loadDataDirectoryEntry(
        join(dirname(file)),
        entry,
        data,
      );
    }

    const directory = this.getOrCreateDirectory(dirname(file));
    await this.#loadEntry(directory, entry);
  }

  /**
   * Load an entry from a directory
   */
  async #loadEntry(directory: iDirectory, entry: Deno.DirEntry) {
    if (entry.isSymlink || entry.name.startsWith(".")) {
      return;
    }

    const path = join(directory.src.path, entry.name);
    const metrics = this.site.metrics;

    if (this.staticFiles.has(path) || this.ignored.has(path)) {
      return;
    }

    if (entry.isDirectory && entry.name === "_data") {
      const metric = metrics.start("Load", { path });
      directory.data = await this.#loadDataDirectory(path);
      return metric.stop();
    }

    if (entry.isFile && /^_data\.\w+$/.test(entry.name)) {
      const metric = metrics.start("Load", { path });
      directory.data = await this.#loadData(path);
      return metric.stop();
    }

    if (entry.name.startsWith("_")) {
      return;
    }

    if (entry.isFile) {
      const metric = metrics.start("Load", { path });
      const page = await this.#loadPage(path);

      if (page) {
        directory.setPage(entry.name, page);
      } else {
        directory.unsetPage(entry.name);
      }
      return metric.stop();
    }

    if (entry.isDirectory) {
      const metric = metrics.start("Load", { path });
      const subDirectory = directory.createDirectory(entry.name);
      await this.loadDirectory(subDirectory);
      return metric.stop();
    }
  }

  /**
   * Create and returns a Page
   */
  async #loadPage(path: string) {
    const result = searchByExtension(path, this.pages);

    if (!result) {
      return;
    }

    const [ext, loader] = result;
    const fullPath = this.site.src(path);

    if (!existsSync(fullPath)) {
      return;
    }

    const info = await Deno.stat(fullPath);
    const page = new Page({
      path: path.slice(0, -ext.length),
      lastModified: info.mtime || undefined,
      created: info.birthtime || undefined,
      ext,
    });

    const data = await this.load(fullPath, loader);

    if (!data.date) {
      data.date = getDate(page);
    } else if (!(data.date instanceof Date)) {
      throw new Exception(
        'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
        { path },
      );
    }

    page.data = data;

    // If it's not an asset, remove the extension
    if (!this.assets.has(page.dest.ext)) {
      page.dest.ext = "";
    }

    // Sub-extensions. Ex: styles.css.njk
    const subext = extname(page.dest.path);

    if (subext) {
      page.dest.path = page.dest.path.slice(0, -subext.length);
      page.dest.ext = subext;
    }

    return page;
  }

  /**
   * Load a _data.* file and return the content
   */
  async #loadData(path: string): Promise<Data> {
    const result = searchByExtension(path, this.data);

    if (result) {
      const [, loader] = result;
      return await this.load(this.site.src(path), loader);
    }

    return {};
  }

  /**
   * Load a _data directory and return the content of all files
   */
  async #loadDataDirectory(path: string) {
    const data = {};

    for (const entry of Deno.readDirSync(this.site.src(path))) {
      await this.#loadDataDirectoryEntry(path, entry, data);
    }

    return data;
  }

  /**
   * Load a data file inside a _data directory
   */
  async #loadDataDirectoryEntry(
    path: string,
    entry: Deno.DirEntry,
    data: Record<string, unknown>,
  ) {
    if (
      entry.isSymlink ||
      entry.name.startsWith(".") || entry.name.startsWith("_")
    ) {
      return;
    }

    if (entry.isFile) {
      const name = basename(entry.name, extname(entry.name));

      data[name] = Object.assign(
        data[name] || {},
        await this.#loadData(join(path, entry.name)),
      );

      return;
    }

    if (entry.isDirectory) {
      data[entry.name] = await this.#loadDataDirectory(join(path, entry.name));
    }
  }

  /**
   * Load a file and save the content in the cache
   */
  load(path: string, loader: Loader): Promise<Data> {
    try {
      if (!this.#cache.has(path)) {
        this.#cache.set(path, loader(path));
      }

      return this.#cache.get(path)!;
    } catch (err) {
      throw new Exception("Couldn't load this file", { path }, err);
    }
  }
}

function getDate(page: iPage) {
  const { src, dest } = page;
  const fileName = basename(src.path);

  const dateInPath = fileName.match(
    /^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)(?:-(\d\d))?)?_/,
  );

  if (dateInPath) {
    const [found, year, month, day, hour, minute, second] = dateInPath;
    dest.path = dest.path.replace(found, "");

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour ? parseInt(hour) : 0,
      minute ? parseInt(minute) : 0,
      second ? parseInt(second) : 0,
    );
  }

  const orderInPath = fileName.match(/^(\d+)_/);

  if (orderInPath) {
    const [found, timestamp] = orderInPath;
    dest.path = dest.path.replace(found, "");
    return new Date(parseInt(timestamp));
  }

  return src.created || src.lastModified;
}
