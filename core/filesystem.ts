import { join } from "../deps/path.ts";
import { documentToString, normalizePath, stringToDocument } from "./utils.ts";

import type { HTMLDocument } from "../deps/dom.ts";

/** Abstract class with common functions for Resource and Directory classes */
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

  /** Merge more data with the existing */
  addData(data: Data) {
    const oldTags = this.#data?.tags || [];
    const newTags = data.tags || [];
    const merged = { ...this.#data, ...data };
    merged.tags = [...oldTags, ...newTags];
    this.data = merged;
  }

  /** Clean the cache of the merged data */
  refreshCache() {
    this.#cache = undefined;
  }
}

/** Page and resource of the site */
export abstract class Resource extends Base {
  /** The destination of the resource */
  dest: Dest;

  /** Internal data */
  #_data = {};

  /** Count duplicated resources */
  #copy = 0;

  constructor(src?: Src) {
    super(src);

    this.dest = {
      path: normalizePath(this.src.path),
      ext: this.src.ext || "",
    };
  }

  /** Duplicate this resource. Optionally, you can provide new data */
  duplicate(data = {}): Page {
    const resource = new Page({ ...this.src });
    resource.dest = { ...this.dest };
    resource.data = { ...this.data, ...data };
    resource.parent = this.parent;
    resource.src.path += `[${this.#copy++}]`;

    return resource;
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
  abstract set content(content: Content | undefined);
  abstract get content(): Content | undefined;
}

export type Resources = { pages: Page[]; assets: Asset[] };

/** A page of the site */
export class Page extends Resource {
  /** The parsed HTML (only for HTML documents) */
  #document?: HTMLDocument;

  /** The page content (string or Uint8Array) */
  #content?: Content;

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

/** An asset of the site */
export class Asset extends Resource {
  /** The asset content (string or Uint8Array) */
  #content?: Content;

  /** The content of this asset */
  set content(content: Content | undefined) {
    this.#content = content instanceof Uint8Array
      ? content
      : content && content.toString();
  }

  get content(): Content | undefined {
    return this.#content;
  }
}

/** A directory of the src folder */
export class Directory extends Base {
  pages = new Map<string, Page>();
  assets = new Map<string, Asset>();
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

  /** Add an asset to this directory */
  setAsset(name: string, asset: Asset) {
    const oldAsset = this.pages.get(name);
    asset.parent = this;
    this.assets.set(name, asset);

    if (oldAsset) {
      asset.dest.hash = oldAsset.dest.hash;
    }
  }

  /** Remove an asset from this directory */
  unsetAsset(name: string) {
    this.assets.delete(name);
  }

  /** Return the list of assets in this directory recursively */
  *getAssets(): Iterable<Asset> {
    for (const asset of this.assets.values()) {
      yield asset;
    }

    for (const dir of this.dirs.values()) {
      yield* dir.getAssets();
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
  /** List of tags assigned to a resource or folder */
  tags?: string[];

  /** The url of a resource */
  url?: string | ((resource: Resource) => string);

  /** If is `true`, the page will be visible only in `dev` mode */
  draft?: boolean;

  /** The date creation of the resource */
  date?: Date;

  /** To configure the render order of a resource */
  renderOrder?: number;

  /** The content of a resource */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** Whether render this page on demand or not */
  ondemand?: boolean;

  [index: string]: unknown;
}
