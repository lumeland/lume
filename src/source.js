import {
  join,
  dirname,
  basename,
  extname,
} from "../deps/path.js";
import { Directory, Page } from "./tree.js";

export default class Source {
  tree = new Directory({ path: "/" });

  assets = new Map();
  data = new Map();
  pages = new Map();
  staticFiles = new Map();

  constructor(path) {
    this.path = path;
  }

  getDirectory(path) {
    let tree = this.tree;

    path.split("/").forEach((name) => {
      if (!name) {
        return;
      }

      tree = tree.dirs.get(name);
    });

    return tree;
  }

  async load() {
    await this.#loadDirectory(this.tree);
    this.tree.expand();
  }

  async update(files) {
    files.forEach(async (file) => {
      const directory = this.getDirectory(dirname(file));

      const entry = {
        name: basename(file),
        isFile: true,
        isDirectory: false,
        isSymlink: false,
      };

      await this.#loadEntry(directory, entry);
    });

    this.tree.expand();
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
    const loader = search(this.data, path);

    if (loader) {
      return loader(join(this.path, path));
    }
  }

  async #loadPage(path) {
    let loader = search(this.pages, path, true);
    let isPage = true;

    if (!loader) {
      loader = search(this.assets, path, true);
      isPage = false;

      if (!loader) {
        return;
      }
    }

    const [ext, load] = loader;
    const fullPath = join(this.path, path);
    const info = await Deno.stat(fullPath);
    const src = {
      path: path,
      lastModified: info.mtime,
      created: info.birthtime,
      ext,
    };

    const page = new Page(src);
    page.addData(await load(fullPath));
    page.isPage = isPage;

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

function search(map, path, returnEntry = false) {
  for (const [key, value] of map) {
    if (path.endsWith(key)) {
      return returnEntry ? [key, value] : value;
    }
  }
}
