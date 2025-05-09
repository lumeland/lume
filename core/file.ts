import { posix } from "../deps/path.ts";
import { documentToString, stringToDocument } from "./utils/dom.ts";
import binaryLoader from "./loaders/binary.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";

import type { MergeStrategy } from "./utils/merge_data.ts";
import type { ProxyComponents } from "./components.ts";
import type { Entry } from "./fs.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/** A page of the site */
export class Page<D extends Data = Data> {
  /** The src info */
  src: Src;

  /** Used to save the page data */
  data: D = {} as D;

  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: Document;

  /** Convenient way to create a page dynamically */
  static create(
    data: Partial<Data> & { url: string },
    src?: Partial<Src>,
  ): Page {
    let { url, ...rest } = data;
    const basename = posix.basename(url).replace(/\.[\w.]+$/, "");
    const page = new Page(src);

    if (url.endsWith("/index.html")) {
      url = url.slice(0, -10);
    }

    page.data = { ...rest, url, page, basename } as Data;
    page.content = data.content as Content | undefined;

    return page;
  }

  constructor(src?: Partial<Src>) {
    this.src = { path: "", ext: "", ...src };
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
  get outputPath(): string {
    const url = this.data.url;
    const outputPath = url.endsWith("/") ? url + "index.html" : url;
    return decodeURIComponentSafe(outputPath);
  }

  /** Returns the source path of this page */
  get sourcePath(): string {
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

  /** The content of this page as text */
  get text(): string {
    return this.content instanceof Uint8Array
      ? decoder.decode(this.content)
      : this.content ?? "";
  }

  set text(text: string) {
    this.content = text;
  }

  /** The content of this page as bytes */
  get bytes(): Uint8Array {
    return this.content instanceof Uint8Array
      ? this.content
      : encoder.encode(this.content || "");
  }

  set bytes(bytes: Uint8Array) {
    this.content = bytes;
  }

  /** The parsed HTML code from the content */
  set document(document: Document) {
    this.#content = undefined;
    this.#document = document;
  }

  get document(): Document {
    if (!this.#document) {
      this.#document = stringToDocument(this.text);
    }

    return this.#document;
  }
}

export class StaticFile<D extends Data = Data> {
  src: Required<Src>;
  data: D = {} as D;
  isCopy = false;

  static create(
    data: Partial<Data> & { url: string },
    src: Required<Src>,
  ): StaticFile {
    const file = new StaticFile(src);
    file.data = { ...data } as Data;
    return file;
  }

  constructor(src: Required<Src>) {
    this.src = src;
  }

  async toPage(): Promise<Page> {
    const { content } = await this.src.entry.getContent(binaryLoader);
    const page = Page.create(this.data, this.src);
    page.content = content as Uint8Array;
    return page;
  }

  /** Returns the output path of this page */
  get outputPath(): string {
    return decodeURIComponentSafe(this.data.url);
  }

  /** Returns the source path of this page */
  get sourcePath(): string {
    if (!this.src.path) {
      return "(generated)";
    }

    return this.src.path + this.src.ext;
  }
}

/** The .src property for a Page or StaticFile */
export interface Src {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file */
  ext: string;

  /** The original entry instance */
  entry?: Entry;
}

/** The .content property for a Page */
export type Content = Uint8Array | string;

/** The data of a page declared initially */
export interface RawData {
  /** List of tags assigned to a page or folder */
  tags?: string | string[];

  /** The url of a page */
  url?: string | false | ((page: Page) => string | false);

  /** The basename of a page */
  basename?: string;

  /** Mark the page as a draft */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date | string | number;

  /** To configure the rendering order of a page */
  renderOrder?: number;

  /** The raw content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** To configure how some data keys will be merged with the parent */
  mergedKeys?: Record<string, MergeStrategy>;

  // deno-lint-ignore no-explicit-any
  [index: string]: any;
}

/** The data of a page/folder once loaded and processed */
export interface Data extends RawData {
  /** The title of the page */
  title?: string;

  /** The type of the page (used to group pages in collections) */
  type?: string;

  /** The id of the page (used to identify a page in a collection) */
  id?: string | number;

  /** List of tags assigned to a page or folder */
  tags: string[];

  /** The url of a page */
  url: string;

  /** The basename of the page */
  basename: string;

  /** The date creation of the page */
  date: Date;

  /**
   * The available components
   * @see https://lume.land/docs/core/components/
   */
  comp: ProxyComponents;

  /** The page reference */
  page: Page;

  /** The language of the page */
  lang?: string;

  /**
   * Unmatched Language URL
   * The url for when the user's language doesn't match with any of the site's available languages.
   *
   * Valid values are:
   * - External URL string (http, https), which is language selector page
   * - Source path string (/), which is language selector page
   * - Language code (en, gl, vi), which is fallback language page
   *
   * This option is made for x-default feature.
   * @see https://developers.google.com/search/docs/specialty/international/localized-versions#xdefault
   */
  unmatchedLangUrl?: string;

  /**
   * Alternate pages (for languages)
   * @see https://lume.land/plugins/multilanguage/
   */
  alternates?: Data[];
}

/** Promote files to pages */
export async function filesToPages(
  files: StaticFile[],
  pages: Page[],
  filter: (file: StaticFile) => boolean,
): Promise<void> {
  const toRemove: StaticFile[] = files.filter(filter);

  for (const file of toRemove) {
    pages.push(await file.toPage());
    files.splice(files.indexOf(file), 1);
  }
}
