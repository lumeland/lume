import { join } from "./deps/path.js";

class Base {
  src = {};
  parent = null;
  #data = {};
  #cache = {};

  constructor(src) {
    this.src = src;
  }

  get tags() {
    if (this.#cache.tags) {
      return this.#cache.tags;
    }

    const tags = new Set();

    if (this.parent) {
      this.parent.tags.forEach((tag) => tags.add(tag));
    }

    if (this.data.tags) {
      this.data.tags.forEach((tag) => tags.add(String(tag)));
    }

    this.#cache.tags = tags;
    return this.#cache.tags;
  }

  get fullData() {
    if (!this.#cache.fullData) {
      if (!this.parent) {
        this.#cache.fullData = this.#data;
      } else {
        this.#cache.fullData = { ...this.parent.fullData, ...this.#data };
      }
    }

    return this.#cache.fullData;
  }

  set data(data = {}) {
    //Ensure tags is always an array
    if (data.tags && !Array.isArray(data.tags)) {
      data.tags = data.tags ? [data.tags] : [];
    }

    this.#data = data;
  }

  get data() {
    return this.#data;
  }

  refreshCache() {
    this.#cache = {};
  }
}

/**
 * Class to represent a page file
 */
export class Page extends Base {
  dest = {};
  #content = null;

  duplicate(data = {}) {
    const page = new Page(this.src);
    page.dest = { ...this.dest };
    page.data = { ...this.data, ...data };
    page.parent = this.parent;

    return page;
  }

  set content(content) {
    this.#content = content;
  }

  get content() {
    return this.#content;
  }
}

/**
 * Class to represent a directory
 */
export class Directory extends Base {
  pages = new Map();
  dirs = new Map();

  createDirectory(name) {
    const path = join(this.src.path, name);
    const directory = new Directory({ path });
    directory.parent = this;
    this.dirs.set(name, directory);
    return directory;
  }

  setPage(name, page) {
    const oldPage = this.pages.get(name);
    page.parent = this;
    this.pages.set(name, page);

    if (oldPage) {
      page.dest.hash = oldPage.dest.hash;
    }
  }

  unsetPage(name) {
    this.pages.delete(name);
  }

  *getPages(recursive = true) {
    for (const page of this.pages.values()) {
      yield page;
    }

    if (recursive) {
      for (const dir of this.dirs.values()) {
        yield* dir.getPages();
      }
    }
  }

  refreshCache() {
    this.pages.forEach((page) => page.refreshCache());
    this.dirs.forEach((dir) => dir.refreshCache());
    super.refreshCache();
  }
}
