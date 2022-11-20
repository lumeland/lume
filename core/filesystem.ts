import { posix } from "../deps/path.ts";
import { documentToString, getExtension, stringToDocument } from "./utils.ts";

import type { HTMLDocument } from "../deps/dom.ts";
import type { Component, PageData, ProxyComponents } from "../core.ts";

/** Abstract class with common functions for Page and Directory classes */
abstract class Base {
  /** The src info */
  src: Src;

  /**
   * Used to save the merged data:
   * the base data with the parent data
   */
  data: PageData = {} as PageData;

  /** The parent directory */
  #parent?: Directory;

  /**
   * Used to save the assigned data directly
   * For directories, the content of _data or _data.* files
   * For pages, the front matter or exported variables.
   */
  #baseData: Data = {};

  /**
   * Internal data. Used to save arbitrary data by plugins and processors
   */
  #_data = {};

  constructor(src?: Partial<Src>) {
    this.src = { path: "", slug: "", asset: true, ...src };

    if (this.src.path && !this.src.slug) {
      this.src.slug = posix.basename(this.src.path).replace(/\.[\w.]+$/, "");
    }

    // Detect the date of the page/directory in the filename
    const dateInSlug = this.src.slug.match(/^([^_]+)?_/);

    if (dateInSlug) {
      const [found, dateStr] = dateInSlug;
      const date = createDate(dateStr);

      if (date) {
        this.src.slug = this.src.slug.replace(found, "");
        this.baseData.date = date;
      }
    }
  }

  /** Returns the base data */
  get baseData(): Data {
    return this.#baseData;
  }

  /** Set new base data */
  set baseData(data: Data) {
    this.#baseData = data;
  }

  /** Returns the parent directory */
  get parent(): Directory | undefined {
    return this.#parent;
  }

  /** Set the parent directory */
  set parent(parent: Directory | undefined) {
    this.#parent = parent;
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
}

/** A page of the site */
export class Page extends Base {
  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: HTMLDocument;

  /** Convenient way to create a page dynamically with a url and content */
  static create(url: string, content: Content): Page {
    const slug = posix.basename(url).replace(/\.[\w.]+$/, "");
    const page = new Page({ slug });

    if (url.endsWith("/index.html")) {
      url = url.slice(0, -10);
    }

    page.data = { url, content, page } as PageData;
    page.content = content;

    return page;
  }

  /** Duplicate this page. Optionally, you can provide new data */
  duplicate(index: number | string, baseData: Data = {}): Page {
    const page = new Page({ ...this.src });
    page.parent = this.parent;
    page.baseData = baseData;
    page.src.path += `[${index}]`;

    return page;
  }

  /** Returns the output path of this page */
  get outputPath(): string | undefined {
    const url = this.data.url;

    if (!url) {
      return undefined;
    }

    return url.endsWith("/") ? url + "index.html" : url;
  }

  /**
   * Update the destination file. It also update the data.url accordingly
   * @deprecated Use `page.data.url` to change the url
   */
  updateDest(dest: Partial<Dest>): void {
    const newDest = { ...this.dest, ...dest };

    if (newDest.ext === ".html" && posix.basename(newDest.path) === "index") {
      this.data.url = newDest.path.slice(0, -5);
    } else {
      this.data.url = newDest.path + newDest.ext;
    }
  }

  /** @deprecated Use `page.data.url` or `page.outputPath`. */
  get dest(): Dest {
    const url = this.outputPath;
    if (!url) {
      return { path: "", ext: "" };
    }
    const ext = getExtension(url);
    return {
      path: ext ? url.slice(0, -ext.length) : url,
      ext,
    };
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
    const url = this.data.url as string;

    if (
      !this.#document && this.#content &&
      (url.endsWith(".html") || url.endsWith("/"))
    ) {
      this.#document = stringToDocument(this.#content.toString());
    }

    return this.#document;
  }
}

/** A directory in the src folder */
export class Directory extends Base {
  pages = new Map<string, Page>();
  dirs = new Map<string, Directory>();
  staticFiles = new Set<StaticFile>();
  components: Components = new Map();

  /** Create a subdirectory and return it */
  createDirectory(slug: string): Directory {
    const path = posix.join(this.src.path, slug);
    const directory = new Directory({ path, slug });
    directory.parent = this;
    this.dirs.set(slug, directory);

    return directory;
  }

  /** Add a page to this directory */
  setPage(name: string, page: Page) {
    const oldPage = this.pages.get(name);
    page.parent = this;
    this.pages.set(name, page);

    if (oldPage) {
      page._data.hash = oldPage._data.hash;
    }
  }

  /** Remove a page from this directory */
  unsetPage(name: string) {
    this.pages.delete(name);
  }

  /** Add a static file to this directory */
  setStaticFile(file: StaticFile) {
    file.parent = this;
    this.staticFiles.add(file);
  }
}

export interface StaticFile {
  /** The path to the source file */
  src: string;

  /** The configuration path to the destination file */
  dest?: string | ((path: string) => string);

  /** The final url destination */
  outputPath?: string;

  /** The parent directory where the StaticFile was located */
  parent?: Directory;

  /** The filename from the parent Directory */
  filename: string;

  /** Indicates whether the file was copied after the latest change */
  saved?: boolean;

  /** Indicates whether the source file was removed */
  removed?: boolean;

  /** The remote url (if the file was downloaded) */
  remote?: string;
}

/** The .src property for a Page or Directory */
export interface Src {
  /** The slug name of the file or directory */
  slug: string;

  /** If the page was loaded as asset or not */
  asset: boolean;

  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file (undefined for folders) */
  ext?: string;

  /** The last modified time */
  lastModified?: Date;

  /** The creation time */
  created?: Date;

  /** The remote url (if the file was downloaded) */
  remote?: string;
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
  url?: string | ((page: Page) => string) | false;

  /** If is `true`, the page will be visible only in `dev` mode */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date;

  /** To configure the render order of a page */
  renderOrder?: number;

  /** The raw content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** To configure how some data keys will be merged with the parent */
  mergedKeys?: Record<string, "array" | "stringArray" | "object">;

  /** Whether render this page on demand or not */
  ondemand?: boolean;

  /** The available components */
  comp?: ProxyComponents;

  /** The page object */
  page?: Page;

  // deno-lint-ignore no-explicit-any
  [index: string]: any;
}

export type Components = Map<string, Component | Components>;

export function createDate(str: string): Date | undefined {
  const datetime = str.match(
    /^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)(?:-(\d\d))?)?$/,
  );

  if (datetime) {
    const [, year, month, day, hour, minute, second] = datetime;

    return new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour ? parseInt(hour) : 0,
      minute ? parseInt(minute) : 0,
      second ? parseInt(second) : 0,
    ));
  }
}
