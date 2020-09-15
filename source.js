import {
  join,
  dirname,
  basename,
  extname,
} from "./deps/path.js";
import { Directory, Page } from "./tree.js";

export default class Source {
  root = new Directory({ path: "/" });

  data = new Map();
  pages = new Map();
  staticFiles = new Map();
  assets = new Set();

  constructor(path) {
    this.path = path;
  }

  getDirectory(path) {
    let dir = this.root;

    path.split("/").forEach((name) => {
      if (!name) {
        return;
      }

      dir = dir.dirs.get(name);
    });

    return dir;
  }

  async load(dir = this.root) {
    await this.#loadDirectory(dir);
    dir.expand();
  }

  async update(files) {
    await Promise.all(
      Array.from(files).map((file) => {
        const directory = this.getDirectory(dirname(file));

        const entry = {
          name: basename(file),
          isFile: true,
          isDirectory: false,
          isSymlink: false,
        };

        return this.#loadEntry(directory, entry);
      }),
    );

    this.root.expand();
  }

  getUpdates(files) {
    const staticFiles = new Map();
    const directories = new Set();
    const pages = new Set();

    files:
    for (const file of files) {
      //_data or _includes
      if (file.match(/\/_data\//)) {
        directories.add(join("/", file.split("/_data/").shift()));
        continue;
      }

      if (file.match(/\/_includes\//)) {
        directories.add(join("/", file.split("/_includes/").shift()));
        continue;
      }

      if (file.match(/\/_data.\w+$/)) {
        directories.add(dirname(file));
        continue;
      }

      //Static files
      for (const entry of this.staticFiles) {
        const [from, to] = entry;

        if (file.startsWith(from)) {
          staticFiles.set(file, join(to, file.slice(from.length)));
          continue files;
        }
      }

      //Pages
      pages.add(file);
    }

    //Remove pages inside directories
    for (const page of pages) {
      for (const dir of directories) {
        if (page.startsWith(dir)) {
          pages.remove(page);
          break;
        }
      }
    }

    return [staticFiles, directories, pages];
  }

  async #loadDirectory(directory) {
    const path = join(this.path, directory.src.path);

    return Promise.all(
      Array.from(Deno.readDirSync(path)).map((entry) =>
        this.#loadEntry(directory, entry)
      ),
    );
  }

  async #loadEntry(directory, entry) {
    if (entry.isSymlink || entry.name.startsWith(".")) {
      return;
    }

    const path = join(directory.src.path, entry.name);

    if (this.staticFiles.has(path)) {
      return;
    }

    if (entry.isDirectory && entry.name === "_data") {
      directory.addData(await this.#loadDataFolder(path));
      return;
    }

    if (entry.isFile && entry.name.match(/^_data\.\w+$/)) {
      directory.addData(await this.#loadData(path));
      return;
    }

    if (entry.name.startsWith("_")) {
      return;
    }

    if (entry.isFile) {
      const page = await this.#loadPage(path);

      if (page) {
        directory.pages.set(entry.name, page);
      }
      return;
    }

    if (entry.isDirectory) {
      const subDirectory = new Directory({ path });
      directory.dirs.set(entry.name, subDirectory);
      return this.#loadDirectory(subDirectory);
    }
  }

  async #loadData(path) {
    for (const [ext, loader] of this.data) {
      if (path.endsWith(ext)) {
        return loader(join(this.path, path));
      }
    }
  }

  async #loadPage(path) {
    let ext, load;

    for (const [key, value] of this.pages) {
      if (path.endsWith(key)) {
        ext = key;
        load = value;
        break;
      }
    }

    if (!load) {
      return;
    }

    const fullPath = join(this.path, path);
    const info = await Deno.stat(fullPath);
    const src = {
      path: path.slice(0, -ext.length),
      lastModified: info.mtime,
      created: info.birthtime,
      ext,
    };

    const page = new Page(src);
    page.addData(await load(fullPath));

    page.dest.path = page.src.path;
    page.dest.ext = this.assets.has(ext) ? ext : ".html";

    if (!page.data.date) {
      page.data.date = info.birthtime || info.mtime;
    } else if (!(page.data.date instanceof Date)) {
      throw new Error(
        'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
      );
    }

    return page;
  }

  async #loadDataFolder(path) {
    const data = {};

    await Promise.all(
      Array.from(Deno.readDirSync(join(this.path, path))).map(async (entry) => {
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
      }),
    );

    return data;
  }
}
