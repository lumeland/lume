import { join, posix } from "../deps/path.ts";
import { documentToString, normalizePath, stringToDocument } from "./utils.ts";

import type { HTMLDocument } from "../deps/dom.ts";

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
   * Internal data. Used to save arbitrary data by plugins and processors
   */
  #_data = {};

  /**
   * Used to save the merged data:
   * the base data with the parent data
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

  /** Returns the front matter for pages _data for directories */
  get baseData(): Data | undefined {
    return this.#data;
  }

  /**
   * Merge the data of parent directories recursively
   * and return the merged data
   */
  get data(): Data {
    if (this.#cache) {
      return this.#cache;
    }

    // Merge the data of the parent directories
    let data: Data = this.#data || {};
    let tags = data.tags || [];

    if (this.parent) {
      const parentData = this.parent.data;
      data = { ...parentData, ...data };

      if (parentData.tags) {
        tags = [...parentData.tags, ...tags];
      }
    }

    data.tags = [...new Set(tags)];

    return this.#cache = data;
  }

  /** Replace the data of this object with the given data */
  set data(data: Data) {
    this.#cache = undefined;
    this.#data = data;
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

  /** Clean the cache of the merged data */
  refreshCache() {
    this.#cache = undefined;
  }
}

/** A page of the site */
export class Page extends Base {
  /** The destination of the page */
  dest: Dest;

  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: HTMLDocument;

  /** Count duplicated pages */
  #copy = 0;

  /** Convenient way to create a page dynamically with a url and content */
  static create(url: string, content: Content): Page {
    const ext = posix.extname(url);
    const path = ext ? url.slice(0, -ext.length) : url;

    const page = new Page();
    page.dest = { path, ext };
    page.data = { url, content };
    page.content = content;

    return page;
  }

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

  /** The output path */
  set path(path: string) {
    this.dest.path = path;
    this.updateUrl();
  }

  get path(): string {
    return this.dest.path;
  }

  /** The output extension */
  set ext(ext: string) {
    this.dest.ext = ext;
    this.updateUrl();
  }

  get ext(): string {
    return this.dest.ext;
  }

  /** Update the page url according with the dest value */
  updateUrl() {
    this.data.url =
      (this.dest.ext === ".html" && posix.basename(this.dest.path) === "index")
        ? this.dest.path.slice(0, -5)
        : this.dest.path + this.dest.ext;
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
    if (
      !this.#document && this.#content &&
      (this.dest.ext === ".html" || this.dest.ext === ".htm")
    ) {
      this.#document = stringToDocument(this.#content.toString());
    }

    return this.#document;
  }
}

/** A directory of the src folder */
export class Directory extends Base {
  pages = new Map<string, Page>();
  dirs = new Map<string, Directory>();

  /** Merge more data with the existing */
  addData(data: Data) {
    const oldTags = this.baseData?.tags || [];
    const newTags = data.tags || [];
    const merged = { ...this.baseData, ...data };
    merged.tags = [...oldTags, ...newTags];
    this.data = merged;
  }

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

/** The .src property for a Page or Directory */
export interface Src {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file (undefined for folders) */
  ext?: string;

  /** The last modified time */
  lastModified?: Date;

  /** The creation time */
  created?: Date;
}

/** The .dest property for a Page */
export interface Dest {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file */
  ext: string;

  /** The hash (used to detect content changes) */
  hash?: string;
}

/** The .content property for a Page */
export type Content = Uint8Array | string;

/** The data of a page */
export interface Data {
  /** List of tags assigned to a page or folder */
  tags?: string[];

  /** The url of a page */
  url?: string | ((page: Page) => string);

  /** If is `true`, the page will be visible only in `dev` mode */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date;

  /** To configure the render order of a page */
  renderOrder?: number;

  /** The content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** Whether render this page on demand or not */
  ondemand?: boolean;

  [index: string]: unknown;
}
