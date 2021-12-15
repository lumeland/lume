import { join } from "../deps/path.ts";
import { documentToString, normalizePath, stringToDocument } from "./utils.ts";

import type { HTMLDocument } from "../deps/dom.ts";
import type { Content, Data, Dest, Src } from "../core.ts";

/** Abstract class with common functions for Page and Directory classes */
abstract class Base {
  /** The src info */
  src: Src;

  /** The parent directory */
  parent?: Directory;

  /**
   * Used to save the assigned data directly
   * For directories, the content of _data or _data.* files
   * For pages, the front matter or exported variables.
   */
  #data?: Data;

  /**
   * Used to save the merged data:
   * the assigned data with the parent data
   */
  #cache?: Data;

  constructor(src?: Src) {
    this.src = src || { path: "" };

    // Make data enumerable
    const data = Object.assign(
      Object.getOwnPropertyDescriptor(Base.prototype, "data"),
      { enumerable: true },
    );
    Object.defineProperty(this, "data", data);
  }

  /**
   * Merge the data of parent directories recursively
   * and return the merged data
   */
  get data(): Data {
    if (!this.#cache) {
      this.#cache = this.#getMergedData();
    }

    return this.#cache;
  }

  /** Replace the data of this object with the given data */
  set data(data: Data) {
    this.#cache = undefined;
    this.#data = data;
  }

  /** Merge more data with the existing */
  addData(data: Data) {
    const [oldData, oldTags] = prepareData(this.#data || {});
    const [newData, newTags] = prepareData(data);
    const merged = { ...oldData, ...newData };
    merged.tags = [...oldTags, ...newTags];
    this.data = merged;
  }

  /** Merge and return the data */
  #getMergedData(): Data {
    let [data, tags] = prepareData({ ...this.#data });

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

  /** Clean the cache of the merged data */
  refreshCache() {
    this.#cache = undefined;
  }
}

/** A page of the site */
export class Page extends Base {
  /** The destination of the page */
  dest: Dest;

  /** Internal data */
  #_data = {};

  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: HTMLDocument;

  /** Count duplicated pages */
  #copy = 0;

  constructor(src?: Src) {
    super(src);

    this.dest = {
      path: normalizePath(this.src.path),
      ext: this.src.ext || "",
    };
  }

  /** Duplicate this page. Optionally, you can provide new data */
  duplicate(data = {}): Page {
    const page = new Page({ ...this.src });
    page.dest = { ...this.dest };
    page.data = { ...this.data, ...data };
    page.parent = this.parent;
    page.src.path += `[${this.#copy++}]`;

    return page;
  }

  /**
   * The property _data is to store internal data,
   * used by plugins, processors, etc to save arbitrary values
   */
  set _data(data: Record<string, unknown>) {
    this.#_data = data;
  }

  get _data() {
    return this.#_data;
  }

  /** The content of this page */
  set content(content: Content | undefined) {
    this.#document = undefined;
    this.#content = content instanceof Uint8Array
      ? content
      : content && content.toString();
  }

  get content(): Content | undefined {
    if (this.#document) {
      this.#content = documentToString(this.#document);
      this.#document = undefined;
    }

    return this.#content;
  }

  /** The parsed HTML code from the content */
  set document(document: HTMLDocument | undefined) {
    this.#content = undefined;
    this.#document = document;
  }

  get document(): HTMLDocument | undefined {
    if (!this.#document && this.#content) {
      this.#document = stringToDocument(this.#content.toString());
    }

    return this.#document;
  }
}

/** A directory of the src folder */
export class Directory extends Base {
  pages = new Map<string, Page>();
  dirs = new Map<string, Directory>();

  /** Create a subdirectory and return it */
  createDirectory(name: string): Directory {
    const path = join(this.src.path, name);
    const directory = new Directory({ path });
    directory.parent = this;
    this.dirs.set(name, directory);

    return directory;
  }

  /** Add a page to this directory */
  setPage(name: string, page: Page) {
    const oldPage = this.pages.get(name);
    page.parent = this;
    this.pages.set(name, page);

    if (oldPage) {
      page.dest.hash = oldPage.dest.hash;
    }
  }

  /** Remove a page from this directory */
  unsetPage(name: string) {
    this.pages.delete(name);
  }

  /** Return the list of pages in this directory recursively */
  *getPages(): Iterable<Page> {
    for (const page of this.pages.values()) {
      yield page;
    }

    for (const dir of this.dirs.values()) {
      yield* dir.getPages();
    }
  }

  /** Refresh the data cache in this directory recursively (used for rebuild) */
  refreshCache() {
    this.pages.forEach((page) => page.refreshCache());
    this.dirs.forEach((dir) => dir.refreshCache());
    super.refreshCache();
  }
}

/** Prepare the data, ensuring that tags is an array of strings */
function prepareData(data: Data): [Data, string[]] {
  let tags: string[] = [];

  if (data.tags) {
    tags = Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag))
      : [String(data.tags)];
  }

  return [data, tags];
}
