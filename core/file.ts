import { posix } from "../deps/path.ts";
import { documentToString, stringToDocument } from "./utils/dom.ts";

import type { MergeStrategy } from "./utils/merge_data.ts";
import type { ProxyComponents } from "./source.ts";
import type { Entry } from "./fs.ts";

/** A page of the site */
export class Page<D extends Data = Data> {
  /** The src info */
  src: Src;

  /**
   * Used to save the page data
   */
  data: D = {} as D;

  /**
   * Internal data. Used to save arbitrary data by plugins and processors
   */
  #_data = {};

  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: Document;

  /** Convenient way to create a page dynamically */
  static create(url: string, data?: Partial<Data>): Page {
    const basename = posix.basename(url).replace(/\.[\w.]+$/, "");
    const page = new Page();

    if (url.endsWith("/index.html")) {
      url = url.slice(0, -10);
    }

    page.data = { ...data, url, page, basename } as Data;
    page.content = data?.content;

    return page;
  }

  constructor(src?: Partial<Src>) {
    this.src = { path: "", ext: "", asset: true, ...src };
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

  /** Duplicate this page. */
  duplicate(index: number | undefined, data: D): Page<D> {
    const page = new Page<D>({ ...this.src });

    if (index !== undefined) {
      page.src.path += `[${index}]`;
    }

    data.page = page;
    page.data = data;

    return page;
  }

  /** Returns the output path of this page */
  get outputPath(): string | undefined {
    const url = this.data.url;

    if (!url) {
      return undefined;
    }

    return decodeURI(url.endsWith("/") ? url + "index.html" : url);
  }

  /** Returns the source path of this page */
  get sourcePath(): string {
    if (this.src.entry?.flags.has("remote")) {
      return this.src.entry.src;
    }

    if (!this.src.path) {
      return "(generated)";
    }

    return this.src.path + this.src.ext;
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
  set document(document: Document | undefined) {
    this.#content = undefined;
    this.#document = document;
  }

  get document(): Document | undefined {
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

export interface StaticFile {
  /** The Entry instance of the file */
  entry: Entry;

  /** The final url destination */
  outputPath: string;
}

/** The .src property for a Page */
export interface Src {
  /** If the page was loaded as asset or not */
  asset: boolean;

  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file */
  ext: string;

  /** The original entry instance (empty for pages generated dynamically) */
  entry?: Entry;
}

/** The .content property for a Page */
export type Content = Uint8Array | string;

/** The data of a page declared initially */
export interface RawData {
  /** List of tags assigned to a page or folder */
  tags?: string | string[];

  /** The url of a page */
  url?: string | false | ((page: Page, url: string) => string | false);

  /** The basename of a page */
  basename?: string;

  /** Mark the page as a draft */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date | string | number;

  /** To configure the render order of a page */
  renderOrder?: number;

  /** The raw content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** To configure how some data keys will be merged with the parent */
  mergedKeys?: Record<string, MergeStrategy>;

  /** Whether render this page on demand or not */
  ondemand?: boolean;

  [index: string]: unknown;
}

/** The data of a page/folder once loaded and processed */
export interface Data {
  /** List of tags assigned to a page or folder */
  tags: string[];

  /** The url of a page */
  url: string;

  /** The basename of the page */
  basename: string;

  /** The date creation of the page */
  date: Date;

  /** To configure the render order of a page */
  renderOrder?: number;

  /** The raw content of a page */
  content?: Content;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** To configure how some data keys will be merged with the parent */
  mergedKeys?: Record<string, MergeStrategy>;

  /** Whether render this page on demand or not */
  ondemand?: boolean;

  /**
   * The available components
   * @see https://lume.land/docs/core/components/
   */
  comp: ProxyComponents;

  /** The page reference */
  page: Page;

  /** The custom data */
  // deno-lint-ignore no-explicit-any
  [index: string]: any;
}
