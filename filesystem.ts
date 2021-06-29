import { join } from "./deps/path.ts";
import { HTMLDocument } from "./deps/dom.ts";
import { documentToString, normalizePath, stringToDocument } from "./utils.ts";
import { Content, Data, Dest, Src } from "./types.ts";

class Base {
  src: Src;
  parent: Directory | null = null;
  #data: Data = {};
  #cache?: Data;

  constructor(src: Src) {
    this.src = src;
  }

  /**
   * Returns the merged data associated
   */
  get data(): Data {
    if (!this.#cache) {
      this.#cache = this.#getMergedData();
    }

    return this.#cache;
  }

  /**
   * Set new data
   */
  set data(data: Data) {
    this.#data = data;
  }

  /**
   * Merge and return the data
   */
  #getMergedData(): Data {
    let data = { ...this.#data };
    let tags: string[] = [];

    if (data.tags) {
      tags = Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag))
        : [String(data.tags)];
    }

    if (this.parent) {
      const parentData = this.parent.data;
      data = { ...parentData, ...data };

      if (parentData.tags) {
        tags = [...parentData.tags, ...tags];
      }
    }

    data.tags = [...new Set(tags)];

    return data;
  }

  /**
   * Refresh the cached merged data
   * (used for rebuild)
   */
  refreshCache() {
    this.#cache = undefined;
  }
}

/**
 * Class to represent a page file
 */
export class Page extends Base {
  dest: Dest;
  #content?: Content;
  #document?: HTMLDocument;
  #copy = 0;

  constructor(src: Src) {
    super(src);

    this.dest = {
      path: normalizePath(src.path),
      ext: src.ext || "",
    };
  }

  /**
   * Duplicate this page.
   * Optionally you can provide new data
   */
  duplicate(data = {}) {
    const page = new Page({ ...this.src });
    page.dest = { ...this.dest };
    page.data = { ...this.data, ...data };
    page.parent = this.parent;
    page.src.path += `[${this.#copy++}]`;

    return page;
  }

  /**
   * Set new content to this page
   */
  set content(content: Content | undefined) {
    this.#document = undefined;
    this.#content = content;
  }

  /**
   * Return the page content.
   */
  get content(): Content | undefined {
    if (this.#document) {
      this.#content = documentToString(this.#document);
      this.#document = undefined;
    }

    return this.#content;
  }

  /**
   * Set a new HTMLDocument and replace the content.
   */
  set document(document: HTMLDocument | undefined) {
    this.#content = undefined;
    this.#document = document;
  }

  /**
   * Parse the HTML code and return a HTMLDocument.
   */
  get document(): HTMLDocument | undefined {
    if (!this.#document && this.#content && typeof this.#content === "string") {
      this.#document = stringToDocument(this.#content);
    }

    return this.#document;
  }
}

/**
 * Class to represent a directory
 */
export class Directory extends Base {
  pages: Map<string, Page> = new Map();
  dirs: Map<string, Directory> = new Map();

  /**
   * Create a subdirectory and return it
   */
  createDirectory(name: string) {
    const path = join(this.src.path, name);
    const directory = new Directory({ path });
    directory.parent = this;
    this.dirs.set(name, directory);

    return directory;
  }

  /**
   * Add a page to this directory
   */
  setPage(name: string, page: Page) {
    const oldPage = this.pages.get(name);
    page.parent = this;
    this.pages.set(name, page);

    if (oldPage) {
      page.dest.hash = oldPage.dest.hash;
    }
  }

  /**
   * Remove a page from this directory
   */
  unsetPage(name: string) {
    this.pages.delete(name);
  }

  /**
   * Return the list of pages in this directory
   * and subdirectories recursivelly.
   */
  *getPages(): Iterable<Page> {
    for (const page of this.pages.values()) {
      yield page;
    }

    for (const dir of this.dirs.values()) {
      yield* dir.getPages();
    }
  }

  /**
   * Refresh the data cache in this directory,
   * pages and subdirectories recursively.
   * (used for rebuild)
   */
  refreshCache() {
    this.pages.forEach((page) => page.refreshCache());
    this.dirs.forEach((dir) => dir.refreshCache());
    super.refreshCache();
  }
}
