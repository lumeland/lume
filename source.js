import { basename, dirname, extname, join } from "./deps/path.js";
import { existsSync } from "./deps/fs.js";
import { Directory, Page } from "./filesystem.js";
import { concurrent, normalizePath, searchByExtension } from "./utils.js";

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

    //Update cache on update
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

    //Is a file inside _data folder
    if (file.match(/\/_data\//)) {
      const dir = file.split("/_data/", 2).shift();
      const directory = this.getOrCreateDirectory(dir);
      return this.#loadDataFolderEntry(
        join(directory.src.path, "_data"),
        entry,
        directory.data,
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

    if (this.staticFiles.has(path) || this.ignored.has(path)) {
      return;
    }

    if (entry.isDirectory && entry.name === "_data") {
      directory.data = await this.#loadDataFolder(path);
      return;
    }

    if (entry.isFile && entry.name.match(/^_data\.\w+$/)) {
      directory.data = await this.#loadData(path);
      return;
    }

    if (entry.name.startsWith("_")) {
      return;
    }

    if (entry.isFile) {
      const page = await this.#loadPage(path);

      if (page) {
        directory.setPage(entry.name, page);
      } else {
        directory.unsetPage(entry.name);
      }
      return;
    }

    if (entry.isDirectory) {
      const subDirectory = directory.createDirectory(entry.name);
      await this.loadDirectory(subDirectory);
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

    const [ext, load] = result;
    const fullPath = this.site.src(path);

    if (!existsSync(fullPath)) {
      return;
    }

    const info = await Deno.stat(fullPath);
    const src = {
      path: normalizePath(path.slice(0, -ext.length)),
      lastModified: info.mtime,
      created: info.birthtime,
      ext,
    };

    const dest = {
      path: src.path,
      ext,
    };

    const subext = extname(src.path);

    if (subext && !this.assets.has(ext)) {
      dest.path = dest.path.slice(0, -subext.length);
      dest.ext = subext;
    } else if (!this.assets.has(ext)) {
      dest.ext = ".html";
    }

    const data = await load(fullPath, this);

    if (!data.date) {
      data.date = getDate(src, dest);
    } else if (!(data.date instanceof Date)) {
      throw new Error(
        'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
      );
    }

    const page = new Page(src);
    page.data = data;
    page.dest = dest;

    return page;
  }

  /**
   * Load a _data.* file and return the content
   */
  #loadData(path) {
    const result = searchByExtension(path, this.data);

    if (result) {
      const [, loader] = result;
      return loader(this.site.src(path), this);
    }
  }

  /**
   * Load a _data folder and return the content of all files
   */
  async #loadDataFolder(path) {
    const data = {};

    for (const entry of Deno.readDirSync(this.site.src(path))) {
      await this.#loadDataFolderEntry(path, entry, data);
    }

    return data;
  }

  /**
   * Load a data file inside a _data folder
   */
  async #loadDataFolderEntry(path, entry, data) {
    if (
      entry.isSymlink || entry.name.startsWith(".") ||
      entry.name.startsWith("_")
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
      data[entry.name] = await this.#loadDataFolder(join(path, entry.name));
    }
  }

  async readFile(path, fn = (content) => content) {
    if (this.#cache.has(path)) {
      return this.#cache.get(path);
    }

    try {
      const content = await fn(await Deno.readTextFile(path));
      this.#cache.set(path, content);
      return content;
    } catch (err) {
      console.error(`Error loading the file ${path}`);
      console.error(err);
    }
  }

  async readBinaryFile(path) {
    return await Deno.readFile(path);
  }

  async loadModule(path, fn = (content) => content) {
    if (this.#cache.has(path)) {
      return this.#cache.get(path);
    }

    const hash = new Date().getTime();
    const content = fn(await import(`file://${path}#${hash}`));
    this.#cache.set(path, content);
    return content;
  }
}

function getDate(src, dest) {
  const fileName = basename(src.path);
  const dayInPath = fileName.match(/^(\d{4})-(\d{2})-(\d{2})_/);

  if (dayInPath) {
    const [found, year, month, day] = dayInPath;
    dest.path = dest.path.replace(found, "");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  const timeInPath = fileName.match(
    /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})_/,
  );

  if (timeInPath) {
    const [found, year, month, day, hour, minute, second] = timeInPath;
    dest.path = dest.path.replace(found, "");
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
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
