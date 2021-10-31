import { basename, dirname, extname, join } from "../deps/path.ts";
import { SiteDirectory, SitePage } from "./filesystem.ts";
import {
  checkExtensions,
  concurrent,
  Exception,
  normalizePath,
  searchByExtension,
} from "./utils.ts";
import { Data, Directory, Event, Loader, Page, Site, Source } from "../core.ts";

/**
 * Scan and load files from the source folder
 * with the data, pages, assets and static files
 */
export default class SiteSource implements Source {
  site: Site;

  /** The root of the src directory */
  root?: Directory;

  /** List of extensions to load data files and the loader used */
  dataLoaders: Map<string, Loader> = new Map();

  /** List of extensions to load page files and the loader used */
  pageLoaders: Map<string, Loader> = new Map();

  /** List of files and folders to copy */
  staticFiles: Map<string, string> = new Map();

  /** List of extensions that must be treated as assets (`.css`, `.js`, etc) */
  assets: Set<string> = new Set();

  /** The list of paths to ignore */
  ignored: Set<string> = new Set();

  /** Used to cache the loaded files */
  #cache: Map<string, Promise<Data>> = new Map();

  constructor(site: Site) {
    this.site = site;

    // Update the cache
    site.addEventListener("beforeBuild", () => {
      this.root?.refreshCache();
      this.#cache.clear();
    });

    site.addEventListener("beforeUpdate", (ev: Event) => {
      this.root?.refreshCache();

      for (const filename of ev.files!) {
        this.#cache.delete(site.src(filename));
      }
    });
  }

  addDataLoader(extensions: string[], loader: Loader) {
    checkExtensions(extensions);
    extensions.forEach((extension) => this.dataLoaders.set(extension, loader));
  }

  addPageLoader(extensions: string[], loader: Loader, isAsset: boolean) {
    checkExtensions(extensions);
    extensions.forEach((extension) => this.pageLoaders.set(extension, loader));

    if (isAsset) {
      extensions.forEach((extension) => this.assets.add(extension));
    }
  }

  getPageLoader(path: string): [ext: string, loader: Loader] | undefined {
    return searchByExtension(path, this.pageLoaders);
  }

  addStaticFile(from: string, to: string) {
    this.staticFiles.set(join("/", from), join("/", to));
    this.addIgnoredPath(from); // Ignore static paths
  }

  addIgnoredPath(path: string) {
    this.ignored.add(join("/", path));
  }

  get pages(): Iterable<Page> {
    return this.root?.getPages() ?? [];
  }

  load() {
    this.root = new SiteDirectory({ path: "/" });
    return this.#loadDirectory(this.root);
  }

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

  getFileOrDirectory(path: string): Directory | Page | undefined {
    let result: Directory | Page | undefined = this.root;

    path.split("/").forEach((name) => {
      if (!name || !result) {
        return;
      }

      if (result instanceof SiteDirectory) {
        result = result.dirs.get(name) || result.pages.get(name);
      }
    });

    return result;
  }

  readFile(path: string, loader: Loader): Promise<Data> {
    try {
      if (!this.#cache.has(path)) {
        this.#cache.set(path, loader(path));
      }

      return this.#cache.get(path)!;
    } catch (cause) {
      throw new Exception("Couldn't load this file", { cause, path });
    }
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
    const path = this.site.src(directory.src.path);

    return concurrent(
      Deno.readDir(path),
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

      return await this.#loadDataDirectoryEntry(
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
      dir = this.root = new SiteDirectory({ path: "/" });
      const path = this.site.src();

      await concurrent(
        Deno.readDir(path),
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

      const path = this.site.src(dir.src.path);

      await concurrent(
        Deno.readDir(path),
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
    const { metrics } = this.site;

    if (this.ignored.has(path)) {
      return;
    }

    if (entry.isDirectory && entry.name === "_data") {
      const metric = metrics.start("Load", { path });
      directory.addData(await this.#loadDataDirectory(path));
      return metric.stop();
    }

    if (entry.isFile && /^_data\.\w+$/.test(entry.name)) {
      const metric = metrics.start("Load", { path });
      directory.addData(await this.#loadData(path));
      return metric.stop();
    }

    if (onlyData || entry.name.startsWith("_")) {
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
      await this.#loadDirectory(subDirectory);
      return metric.stop();
    }
  }

  /** Create and return a Page */
  async #loadPage(path: string) {
    const result = this.getPageLoader(path);

    if (!result) {
      return;
    }

    const [ext, loader] = result;
    const fullPath = this.site.src(path);

    let info: Deno.FileInfo | undefined;

    try {
      info = await Deno.stat(fullPath);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return;
      }
    }

    const page = new SitePage({
      path: path.slice(0, -ext.length),
      lastModified: info?.mtime || undefined,
      created: info?.birthtime || undefined,
      ext,
    });

    const data = await this.readFile(fullPath, loader);

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

    // Subextensions, like styles.css.njk
    const subext = extname(page.dest.path);

    if (subext) {
      page.dest.path = page.dest.path.slice(0, -subext.length);
      page.dest.ext = subext;
    }

    return page;
  }

  /** Load a _data.* file and return the content */
  async #loadData(path: string): Promise<Data> {
    const result = searchByExtension(path, this.dataLoaders);

    if (result) {
      const [, loader] = result;
      return await this.readFile(this.site.src(path), loader);
    }

    return {};
  }

  /** Load a _data directory and return the content of all files */
  async #loadDataDirectory(path: string) {
    const data = {};

    for (const entry of Deno.readDirSync(this.site.src(path))) {
      await this.#loadDataDirectoryEntry(path, entry, data);
    }

    return data;
  }

  /** Load a data file inside a _data directory */
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
      const fileData = await this.#loadData(join(path, entry.name));

      if (fileData.content && Object.keys(fileData).length === 1) {
        data[name] = fileData.content;
      } else {
        data[name] = Object.assign(data[name] || {}, fileData);
      }

      return;
    }

    if (entry.isDirectory) {
      data[entry.name] = await this.#loadDataDirectory(join(path, entry.name));
    }
  }
}

function getDate(page: Page) {
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
