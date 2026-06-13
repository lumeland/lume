import { posix } from "../deps/path.ts";
import { documentToString, stringToDocument } from "./utils/dom.ts";
import binaryLoader from "./loaders/binary.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";

import type { MergeStrategy } from "./utils/merge_data.ts";
import type { ProxyComponents } from "./components.ts";
import type { Entry } from "./fs.ts";
import { isPlainObject } from "./utils/object.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const URL_IS_HTML = /(\/|\.x?html)$/;

/** A page of the site */
export class Page<D extends DataIn = Data> {
  /** The src info */
  src: Src;

  /** Used to save the page data */
  data: D & { basename: string; page: Page<D> };

  /** Whether this page comes from a copied file with site.copy() */
  isCopy = false;

  /** The page content (string or Uint8Array) */
  #content?: Content;

  /** The parsed HTML (only for HTML documents) */
  #document?: Document;

  /** Convenient way to create a page dynamically */
  static create<D extends DataIn>(
    data: D & { content?: Content },
    src?: Partial<Src>,
  ): Page<D> {
    const basename = posix.basename(data.url).replace(/\.[\w.]+$/, "");

    if (data.url.endsWith("/index.html")) {
      data.url = data.url.slice(0, -10);
    }

    const page = new Page<D>(src, {
      ...data,
      basename,
    });
    page.content = data.content;

    return page;
  }

  constructor(src?: Partial<Src>, data?: D) {
    this.data = { ...data, page: this } as unknown as Page<D>["data"];
    this.src = { path: "", ext: "", ...src };
  }

  /** Duplicate this page. */
  duplicate(index: number | undefined, data: D): Page<D> {
    const page = new Page<D>({ ...this.src }, data);

    if (index !== undefined) {
      page.src.path += `[${index}]`;
    }

    return page;
  }

  /** To check if the page is HTML */
  get isHTML(): boolean {
    return URL_IS_HTML.test(this.data.url);
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

    return this.src.entry?.path ?? this.src.path + this.src.ext;
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
  get bytes(): Uint8Array<ArrayBuffer> {
    return this.content instanceof Uint8Array
      ? this.content
      : encoder.encode(this.content || "") as Uint8Array<ArrayBuffer>;
  }

  set bytes(bytes: Uint8Array<ArrayBuffer>) {
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

export class StaticFile<D extends FileData = FileData> {
  /** The src info */
  src: Required<Src>;

  /** Used to save the contextual data */
  data: D;

  /** Whether this file must be copied with site.copy() */
  isCopy = false;

  static create<D extends FileData>(
    data: D,
    src: Required<Src>,
  ): StaticFile<D> {
    const file = new StaticFile(src, data);
    return file;
  }

  constructor(src: Required<Src>, data?: D) {
    this.data = data ?? {} as D;
    this.src = src;
  }

  async toPage(): Promise<Page<D & DataIn>> {
    const { content } = await this.src.entry.getContent(binaryLoader);
    const page = Page.create(
      { ...this.data } as D & { content?: Content },
      this.src,
    );
    page.content = content as Uint8Array<ArrayBuffer>;
    page.isCopy = this.isCopy;
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

    return this.src.entry.path;
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
export type Content = Uint8Array<ArrayBuffer> | string;

/** The data of a page declared initially */
export interface RawData {
  /** The url of a page */
  url?:
    | string
    | false
    | ((page: Page<DataIn>) => string | false);

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
  layout?: string | null;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** To configure how some data keys will be merged with the parent */
  mergedKeys?: Record<string, MergeStrategy>;

  [index: string]: unknown;
}

export interface DataIn extends RawData {
  /** The url of a page */
  url: string;
}

export interface DirectoryData extends RawData {
  /** The basename of the page */
  basename: string;

  /**
   * The available components
   * @see https://lume.land/docs/core/components/
   */
  comp: ProxyComponents;
}

export interface FileData extends DirectoryData {
  /** The url of a page */
  url: string;
}

/** The data of a page/folder once loaded and processed */
export interface Data extends FileData {
  /** The page reference */
  page: Page<this>;

  /** The date creation of the page */
  date: Date;
}

/** Promote files to pages */
export async function filesToPages<D extends Data>(
  files: StaticFile<D>[],
  pages: Page<D>[],
  filter: (file: StaticFile<D>) => boolean,
): Promise<void> {
  const toRemove: StaticFile<D>[] = files.filter(filter);

  for (const file of toRemove) {
    pages.push(await file.toPage());
    files.splice(files.indexOf(file), 1);
  }
}

export function ensureRawData(data: Record<string, unknown>): data is RawData {
  if (
    typeof data.url !== "undefined" && typeof data.url !== "string" &&
    typeof data.url !== "function" && data.url !== false
  ) {
    return false;
  }
  if (
    typeof data.basename !== "undefined" && typeof data.basename !== "string"
  ) {
    return false;
  }
  if (typeof data.draft !== "undefined" && typeof data.draft !== "boolean") {
    return false;
  }
  if (
    typeof data.date !== "undefined" && typeof data.date !== "string" &&
    typeof data.date !== "number" && !(data.date instanceof Date)
  ) {
    return false;
  }
  if (
    typeof data.renderOrder !== "undefined" &&
    typeof data.renderOrder !== "number"
  ) {
    return false;
  }
  if (
    data.layout !== null && data.layout !== undefined &&
    typeof data.layout !== "string"
  ) {
    return false;
  }
  if (
    typeof data.templateEngine !== "undefined" &&
    typeof data.templateEngine !== "string" &&
    !Array.isArray(data.templateEngine)
  ) {
    return false;
  }
  if (!isPlainObject(data.mergedKeys)) {
    return false;
  }

  return true;
}
