import { join } from "./deps/path.js";

class Base {
  src = {};
  #_parent = null;
  #_data = {};
  #_tags = null;

  constructor(src) {
    this.src = src;
  }

  get parent() {
    return this.#_parent;
  }

  set parent(parent) {
    this.#_parent = parent;
  }

  get tags() {
    if (this.#_tags) {
      return this.#_tags;
    }

    const tags = new Set();
    this.parent.tags.forEach((tag) => tags.add(tag));

    const dataTags = this.data.tags;
    if (dataTags) {
      if (Array.isArray(dataTags)) {
        dataTags.forEach((tag) => tags.add(tag));
      } else {
        tags.add(dataTags);
      }
    }

    this.#_tags = tags;
    return this.#_tags;
  }

  get fullData() {
    if (!this.parent) {
      return this.#_data;
    }

    const parentData = this.parent.fullData;

    return { ...parentData, ...this.#_data };
  }

  set data(data = {}) {
    this.#_data = data;
    this.#_tags = null;
  }

  get data() {
    return this.#_data;
  }
}

/**
 * Class to represent a page file
 */
export class Page extends Base {
  dest = {};
  url = null;
  rendered = null;

  get content() {
    return this.data.content;
  }

  set content(content) {
    this.data.content = content;
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
    page.parent = this;
    this.pages.set(name, page);
  }

  *getPages(recursive = true) {
    for (const page of this.pages.values()) {
      yield [page, this];
    }

    if (recursive) {
      for (const dir of this.dirs.values()) {
        yield* dir.getPages();
      }
    }
  }
}
