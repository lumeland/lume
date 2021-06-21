import { join } from "./deps/path.ts";
import { documentToString, stringToDocument } from "./utils.ts";

class Base {
  src = {};
  parent = null;
  #data = {};
  #cache = null;

  constructor(src = {}) {
    this.src = src;
  }

  get data() {
    if (!this.#cache) {
      this.#cache = this.getMergedData();
    }

    return this.#cache;
  }

  set data(data = {}) {
    this.#data = data;
  }

  getMergedData() {
    let data = { ...this.#data }, tags = [];

    if (data.tags) {
      tags = Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag))
        : [String(data.tags)];
    }

    if (this.parent) {
      data = { ...this.parent.data, ...data };
      tags = [...this.parent.data.tags, ...tags];
    }

    data.tags = [...new Set(tags)];

    return data;
  }

  refreshCache() {
    this.#cache = null;
  }
}

/**
 * Class to represent a page file
 */
export class Page extends Base {
  dest = {};
  #content = null;
  #document = null;
  #copy = 0;

  duplicate(data = {}) {
    const page = new Page({ ...this.src });
    page.dest = { ...this.dest };
    page.data = { ...this.data, ...data };
    page.parent = this.parent;
    page.src.path += `[${this.#copy++}]`;

    return page;
  }

  set content(content) {
    this.#document = null;
    this.#content = content;
  }

  get content() {
    if (this.#document) {
      this.#content = documentToString(this.#document);
      this.#document = null;
    }

    return this.#content;
  }

  set document(document) {
    this.#content = null;
    this.#document = document;
  }

  get document() {
    if (!this.#document && this.#content) {
      this.#document = stringToDocument(this.#content);
    }

    return this.#document;
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
