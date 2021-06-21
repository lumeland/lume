import { basename, dirname, extname, join } from "./deps/path.ts";
import { existsSync } from "./deps/fs.ts";
import { Directory, Page } from "./filesystem.ts";
import {
  concurrent,
  Exception,
  normalizePath,
  searchByExtension,
} from "./utils.ts";

export default class Source {
  root = new Directory({ path: "/" });

  data = new Map();
  pages = new Map();
  staticFiles = new Map();
  assets = new Set();
  ignored = new Set();
  #cache = new Map();

  constructor(site) {
    this.site = site;

    // Update cache
    site.addEventListener("beforeBuild", () => {
      this.root.refreshCache();
      this.#cache.clear();
    });

    site.addEventListener("beforeUpdate", (ev) => {
      this.root.refreshCache();

      for (const filename of ev.files) {
        this.#cache.delete(site.src(filename));
      }
    });
  }

  /**
   * Returns the Directory instance of a path
   */
  getOrCreateDirectory(path) {
    let dir = this.root;

    path.split("/").forEach((name) => {
      if (!name || !dir) {
        return;
      }

      if (!dir.dirs.has(name)) {
        dir.createDirectory(name);
      }

      dir = dir.dirs.get(name);
    });

    return dir;
  }

  /**
   * Returns the File or Directory of a path
   */
  getFileOrDirectory(path) {
    let result = this.root;

    path.split("/").forEach((name) => {
      if (!name || !result) {
        return;
      }

      if (result instanceof Directory) {
        result = result.dirs.get(name) || result.pages.get(name);
      } else {
        return null;
      }
    });

    return result;
  }

  /**
   * Check whether a file is included in the static files
   */
  isStatic(file) {
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
  isIgnored(path) {
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
  loadDirectory(directory = this.root) {
    const path = this.site.src(directory.src.path);

    return concurrent(
      Deno.readDir(path),
      (entry) => this.#loadEntry(directory, entry),
    );
  }

  /**
   * Reload some files
   */
  async loadFile(file) {
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
      let data = directory.data;

      for (const name of path) {
        if (!(name in data)) {
          data[name] = {};
        }

        data = data[name];
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
  async #loadEntry(directory, entry) {
    if (entry.isSymlink || entry.name.startsWith(".")) {
      return;
    }

    const path = join(directory.src.path, entry.name);
    const metrics = this.site.metrics;

    if (this.staticFiles.has(path) || this.ignored.has(path)) {
      return;
    }

    if (entry.isDirectory && entry.name === "_data") {
      metrics.start("Load", path);
      directory.data = await this.#loadDataDirectory(path);
      metrics.end("Load", path);
      return;
    }

    if (entry.isFile && /^_data\.\w+$/.test(entry.name)) {
      metrics.start("Load", path);
      directory.data = await this.#loadData(path);
      metrics.end("Load", path);
      return;
    }

    if (entry.name.startsWith("_")) {
      return;
    }

    if (entry.isFile) {
      metrics.start("Load", path);
      const page = await this.#loadPage(path);

      if (page) {
        directory.setPage(entry.name, page);
      } else {
        directory.unsetPage(entry.name);
      }
      metrics.end("Load", path);
      return;
    }

    if (entry.isDirectory) {
      metrics.start("Load", path);
      const subDirectory = directory.createDirectory(entry.name);
      await this.loadDirectory(subDirectory);
      metrics.end("Load", path);
      return;
    }
  }

  /**
   * Create and returns a Page
   */
  async #loadPage(path) {
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
    const src = {
      path: path.slice(0, -ext.length),
      lastModified: info.mtime,
      created: info.birthtime,
      ext,
    };

    const data = await this.load(fullPath, loader);

    if (!data.date) {
      data.date = getDate(src, dest);
    } else if (!(data.date instanceof Date)) {
      throw new Exception(
        'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
        { path },
      );
    }

    const page = new Page(src);
    page.data = data;

    if (this.assets.has(page.dest.ext)) {
      page.dest.ext = "";
    }

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
  #loadData(path) {
    const result = searchByExtension(path, this.data);

    if (result) {
      const [, loader] = result;
      return this.load(this.site.src(path), loader);
    }
  }

  /**
   * Load a _data directory and return the content of all files
   */
  async #loadDataDirectory(path) {
    const data = {};

    for (const entry of Deno.readDirSync(this.site.src(path))) {
      await this.#loadDataDirectoryEntry(path, entry, data);
    }

    return data;
  }

  /**
   * Load a data file inside a _data directory
   */
  async #loadDataDirectoryEntry(path, entry, data) {
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
  async load(path, loader) {
    if (this.#cache.has(path)) {
      return this.#cache.get(path);
    }

    try {
      const content = await loader(path);
      this.#cache.set(path, content);

      return content;
    } catch (err) {
      throw new Exception("Couldn't load this file", { path }, err);
    }
  }
}

function getDate(src, dest) {
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
