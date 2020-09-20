import { join } from "./deps/path.js";

class Base {
  src = {};
  #parent = null;
  #data = {};
  #tags = null;

  constructor(src) {
    this.src = src;
  }

  set parent(parent) {
    this.#parent = parent;
  }

  get tags() {
    if (this.#tags) {
      return this.#tags;
    }

    const tags = new Set();

    if (this.#parent) {
      this.#parent.tags.forEach((tag) => tags.add(tag));
    }

    const dataTags = this.data.tags;
    if (dataTags) {
      if (Array.isArray(dataTags)) {
        dataTags.forEach((tag) => tags.add(tag));
      } else {
        tags.add(dataTags);
      }
    }

    this.#tags = tags;
    return this.#tags;
  }

  get fullData() {
    if (!this.#parent) {
      return this.#data;
    }

    const parentData = this.#parent.fullData;

    return { ...parentData, ...this.#data };
  }

  set data(data = {}) {
    this.#data = data;
    this.#tags = null;
  }

  get data() {
    return this.#data;
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
      yield [page, this];
    }

    if (recursive) {
      for (const dir of this.dirs.values()) {
        yield* dir.getPages();
      }
    }
  }
}
